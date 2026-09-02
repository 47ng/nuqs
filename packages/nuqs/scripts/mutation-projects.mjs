import { existsSync } from 'node:fs'
import { join } from 'node:path'

const operationalConfigKeys = new Set([
  '$schema',
  'allowConsoleColors',
  'clearTextReporter',
  'dashboard',
  'eventReporter',
  'fileLogLevel',
  'force',
  'htmlReporter',
  'incremental',
  'incrementalFile',
  'jsonReporter',
  'logLevel',
  'mutate',
  'reporters',
  'tempDirName',
  'testFiles',
  'warnings'
])

export function comparableMutationConfig(node, browser) {
  return {
    strategy: 'runtime-ownership-v1',
    node: comparableConfig(node),
    browser: comparableConfig(browser)
  }
}

export function createMutationProjects(root, browserProjects) {
  const browserMutate = []
  const browserTestFiles = []

  for (const project of browserProjects) {
    assertFileExists(root, project.mutate, 'browser mutation source')
    if (browserMutate.includes(project.mutate)) {
      throw new Error(`duplicate browser mutation source: ${project.mutate}`)
    }
    browserMutate.push(project.mutate)

    for (const testFile of project.testFiles) {
      assertFileExists(root, testFile, 'browser mutation test')
      if (!browserTestFiles.includes(testFile)) {
        browserTestFiles.push(testFile)
      }
    }
  }

  browserMutate.sort()
  browserTestFiles.sort()

  return {
    browserMutate,
    browserTestFiles,
    nodeMutate: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.test.{ts,tsx}',
      '!src/adapters/**',
      ...browserMutate.map(path => `!${path}`)
    ]
  }
}

function assertFileExists(root, path, kind) {
  if (!existsSync(join(root, path))) {
    throw new Error(`${kind} does not exist: ${path}`)
  }
}

function comparableConfig(config) {
  return Object.fromEntries(
    Object.entries(config).filter(([key]) => !operationalConfigKeys.has(key))
  )
}
