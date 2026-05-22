import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const args = new Set(process.argv.slice(2))
const includeApp = args.has('--all') || args.has('--app') || (!args.has('--app') && !args.has('--runtime'))
const includeRuntime =
  args.has('--all') || args.has('--runtime') || (!args.has('--app') && !args.has('--runtime'))

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const readGitRefFromPackedRefs = (gitDir, refName) => {
  const packedRefsPath = path.join(gitDir, 'packed-refs')
  if (!fs.existsSync(packedRefsPath)) return ''

  const packedRefs = fs.readFileSync(packedRefsPath, 'utf8')
  const lines = packedRefs.split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('^')) continue
    const [sha, ref] = trimmed.split(' ')
    if (ref === refName && sha) return sha.trim()
  }

  return ''
}

const readGitInfoFromFiles = () => {
  const gitDir = path.join(rootDir, '.git')
  const headPath = path.join(gitDir, 'HEAD')
  if (!fs.existsSync(headPath)) {
    return { sha: '', branch: '' }
  }

  const headContent = fs.readFileSync(headPath, 'utf8').trim()
  if (!headContent) {
    return { sha: '', branch: '' }
  }

  if (headContent.startsWith('ref: ')) {
    const refName = headContent.slice(5).trim()
    const refPath = path.join(gitDir, refName)
    const shaFromRef = fs.existsSync(refPath)
      ? fs.readFileSync(refPath, 'utf8').trim()
      : readGitRefFromPackedRefs(gitDir, refName)
    const branch = refName.split('/').pop() ?? ''
    return { sha: shaFromRef, branch }
  }

  return { sha: headContent, branch: 'detached' }
}

const gitInfoFromFiles = readGitInfoFromFiles()

const resolveGitSha = () =>
  process.env.COMMIT_REF ||
  process.env.GITHUB_SHA ||
  process.env.CI_COMMIT_SHA ||
  gitInfoFromFiles.sha ||
  'unknown'

const resolveGitBranch = () =>
  process.env.BRANCH ||
  process.env.GITHUB_REF_NAME ||
  process.env.CI_COMMIT_BRANCH ||
  gitInfoFromFiles.branch ||
  'unknown'

const rootPackage = readJson(path.join(rootDir, 'package.json'))
const runtimePackage = readJson(path.join(rootDir, 'packages/runtime/package.json'))

const gitSha = resolveGitSha()
const shortSha = gitSha === 'unknown' ? 'unknown' : gitSha.slice(0, 8)
const builtAt = new Date().toISOString()
const buildId = `scrollix-${builtAt.replace(/[-:.TZ]/g, '').slice(0, 14)}-${shortSha}`

const metadata = {
  schemaVersion: 1,
  buildId,
  builtAt,
  git: {
    sha: gitSha,
    shortSha,
    branch: resolveGitBranch()
  },
  versions: {
    repo: rootPackage.version ?? '0.0.0',
    runtime: runtimePackage.version ?? '0.0.0'
  },
  node: process.version
}

const writeMetadata = (targetDir, fileName, targetLabel) => {
  fs.mkdirSync(targetDir, { recursive: true })
  const outputPath = path.join(targetDir, fileName)
  fs.writeFileSync(outputPath, `${JSON.stringify({ ...metadata, target: targetLabel }, null, 2)}\n`, 'utf8')
  console.log(`[Scrollix] wrote ${targetLabel} build metadata -> ${outputPath}`)
}

if (includeApp) {
  writeMetadata(path.join(rootDir, 'dist'), 'scrollix-build.json', 'app')
}

if (includeRuntime) {
  writeMetadata(path.join(rootDir, 'packages/runtime/dist'), 'scrollix-runtime-build.json', 'runtime')
}
