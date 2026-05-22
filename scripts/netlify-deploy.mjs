import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const argv = process.argv.slice(2)

const flag = (name) => argv.includes(name)
const valueOf = (name) => {
  const index = argv.indexOf(name)
  if (index === -1) return ''
  return argv[index + 1] ?? ''
}

const showHelp = () => {
  console.log(`
Scrollix Netlify deploy helper

Usage:
  node scripts/netlify-deploy.mjs [flags]

Flags:
  --deploy-app             Deploy root app site (default if no deploy flag is passed)
  --deploy-runtime         Deploy runtime site (packages/runtime/dist)
  --deploy-all             Deploy app + runtime
  --prod                   Deploy to production (default)
  --draft                  Create draft deploy (non-production)
  --no-build               Skip local builds
  --message "<text>"       Deploy message shown in Netlify logs
  --site-app "<id|name>"   Netlify site id/name for app (fallback: NETLIFY_SITE_ID_APP)
  --site-runtime "<id>"    Netlify site id/name for runtime (fallback: NETLIFY_SITE_ID_RUNTIME)
  --auth-token "<token>"   Netlify auth token (fallback: NETLIFY_AUTH_TOKEN)
  --help                   Show this help

Examples:
  node scripts/netlify-deploy.mjs --deploy-runtime --site-runtime abc123
  node scripts/netlify-deploy.mjs --deploy-all --message "release candidate"
`.trim())
}

if (flag('--help')) {
  showHelp()
  process.exit(0)
}

const deployAll = flag('--deploy-all')
const deployRuntime = deployAll || flag('--deploy-runtime')
const deployApp = deployAll || flag('--deploy-app') || (!deployAll && !deployRuntime)
const isProd = !flag('--draft')
const skipBuild = flag('--no-build')
const deployMessage = valueOf('--message')

const siteApp = valueOf('--site-app') || process.env.NETLIFY_SITE_ID_APP || ''
const siteRuntime = valueOf('--site-runtime') || process.env.NETLIFY_SITE_ID_RUNTIME || ''
const authToken = valueOf('--auth-token') || process.env.NETLIFY_AUTH_TOKEN || ''

const run = (command, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? rootDir,
      env: options.env ?? process.env,
      stdio: 'inherit',
      shell: false
    })

    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`Command failed (${code}): ${command} ${args.join(' ')}`))
    })
  })

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'

const buildTargets = async () => {
  if (skipBuild) return

  if (deployApp) {
    console.log('[Scrollix] building app target...')
    await run(npmCmd, ['run', 'build'], { cwd: rootDir })
    await run(npmCmd, ['run', 'build:metadata:app'], { cwd: rootDir })
  }

  if (deployRuntime) {
    console.log('[Scrollix] building runtime target...')
    await run(npmCmd, ['run', 'build:runtime'], { cwd: rootDir })
  }
}

const deployTarget = async ({ label, siteId, dirPath }) => {
  if (!siteId) {
    throw new Error(
      `[Scrollix] Missing Netlify site id for ${label}. Pass --site-${label} or set NETLIFY_SITE_ID_${label.toUpperCase()}.`
    )
  }

  const args = ['netlify', 'deploy', '--dir', dirPath, '--site', siteId]
  if (isProd) args.push('--prod')
  if (deployMessage) args.push('--message', `[${label}] ${deployMessage}`)
  if (authToken) args.push('--auth', authToken)

  console.log(`[Scrollix] deploying ${label} -> ${siteId}`)
  await run(npxCmd, args, { cwd: rootDir })
}

const main = async () => {
  console.log(
    `[Scrollix] deploy plan: app=${deployApp ? 'yes' : 'no'} runtime=${
      deployRuntime ? 'yes' : 'no'
    } mode=${isProd ? 'prod' : 'draft'}`
  )

  await buildTargets()

  if (deployApp) {
    await deployTarget({
      label: 'app',
      siteId: siteApp,
      dirPath: path.join(rootDir, 'dist')
    })
  }

  if (deployRuntime) {
    await deployTarget({
      label: 'runtime',
      siteId: siteRuntime,
      dirPath: path.join(rootDir, 'packages/runtime/dist')
    })
  }

  console.log('[Scrollix] deploy completed')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
