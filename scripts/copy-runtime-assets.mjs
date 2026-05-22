import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const runtimeDistDir = path.resolve(rootDir, 'packages/runtime/dist')
const appDistDir = path.resolve(rootDir, 'dist')

const runtimeFiles = ['scrollix-runtime.js', 'scrollix-runtime.css', 'scrollix-runtime-build.json']

if (!fs.existsSync(runtimeDistDir)) {
  throw new Error(`Runtime dist not found at ${runtimeDistDir}. Run "npm run build:runtime" first.`)
}

if (!fs.existsSync(appDistDir)) {
  fs.mkdirSync(appDistDir, { recursive: true })
}

for (const fileName of runtimeFiles) {
  const sourceFile = path.join(runtimeDistDir, fileName)
  const targetFile = path.join(appDistDir, fileName)

  if (!fs.existsSync(sourceFile)) {
    throw new Error(`Missing runtime artifact: ${sourceFile}`)
  }

  fs.copyFileSync(sourceFile, targetFile)
  console.log(`[Scrollix] copied ${fileName} -> dist/${fileName}`)
}
