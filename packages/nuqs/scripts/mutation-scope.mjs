import { readFile, readdir, writeFile } from 'node:fs/promises'
import { extname, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [root, reportPath] = process.argv.slice(2)
if (!root || !reportPath) {
  throw new Error('usage: mutation-scope.mjs <nuqs-root> <report>')
}

const loadConfig = async name =>
  (await import(pathToFileURL(resolve(root, name)).href)).default
const node = await loadConfig('stryker.node.config.mjs')
const browser = await loadConfig('stryker.browser.config.mjs')
const report = JSON.parse(await readFile(reportPath, 'utf8'))
const packageJson = JSON.parse(
  await readFile(resolve(root, 'package.json'), 'utf8')
)

if (typeof report.config?.strategy !== 'string') {
  throw new Error('mutation report is missing its runtime ownership strategy')
}
if (typeof packageJson.scripts?.mutation !== 'string') {
  throw new Error('package is missing its mutation command')
}

report.config.scope = {
  strategy: report.config.strategy,
  command: packageJson.scripts.mutation,
  sourceDirectives: await findSourceDirectives(resolve(root, 'src')),
  node: selectScope(node),
  browser: selectScope(browser)
}

await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')

function selectScope(config) {
  return {
    mutate: config.mutate,
    testFiles: [...config.testFiles].sort(),
    excludedMutations: [...(config.mutator?.excludedMutations ?? [])].sort(),
    ignoreStatic: config.ignoreStatic,
    ignorers: [...(config.ignorers ?? [])].sort()
  }
}

async function findSourceDirectives(directory) {
  const directives = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      directives.push(...(await findSourceDirectives(path)))
    } else if (['.ts', '.tsx'].includes(extname(entry.name))) {
      const lines = (await readFile(path, 'utf8')).split('\n')
      for (const [index, line] of lines.entries()) {
        if (/Stryker (disable|restore)/.test(line)) {
          directives.push({
            file: relative(resolve(root, 'src'), path),
            line: index + 1,
            directive: line.trim()
          })
        }
      }
    }
  }
  return directives.sort(
    (left, right) =>
      left.file.localeCompare(right.file) || left.line - right.line
  )
}
