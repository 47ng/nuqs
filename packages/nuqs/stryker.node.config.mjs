import shared from './stryker.shared.config.mjs'
import { nodeMutate } from './stryker.browser.config.mjs'

const config = {
  ...shared,
  mutate: nodeMutate,
  testFiles: [
    'src/!(api|*.browser).test.ts',
    'src/lib/**/!(*.browser).test.ts'
  ],
  vitest: {
    configFile: 'vitest.mutation.config.ts',
    related: false
  },
  tempDirName: '../../node_modules/.cache/stryker-tmp/nuqs-node',
  incrementalFile: 'reports/mutation/cache/node.json'
}

export default config
