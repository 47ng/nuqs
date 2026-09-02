import shared from './stryker.shared.config.mjs'
import { createMutationProjects } from './scripts/mutation-projects.mjs'

export const browserProjects = [
  {
    mutate: 'src/useQueryState.ts',
    testFiles: ['src/useQueryState.browser.test.tsx']
  },
  {
    mutate: 'src/useQueryStates.ts',
    testFiles: [
      'src/useQueryStates.browser.test.tsx',
      'src/useQueryStates.mutation.browser.test.tsx',
      'src/useQueryStates.discarded-reconcile.browser.test.tsx'
    ]
  }
]

export const { browserMutate, browserTestFiles, nodeMutate } =
  createMutationProjects(import.meta.dirname, browserProjects)

const config = {
  ...shared,
  mutate: browserMutate,
  testFiles: browserTestFiles,
  vitest: {
    configFile: 'vitest.browser.mutation.config.ts',
    related: false
  },
  tempDirName: '../../node_modules/.cache/stryker-tmp/nuqs-browser',
  incrementalFile: 'reports/mutation/cache/browser.json'
}

export default config
