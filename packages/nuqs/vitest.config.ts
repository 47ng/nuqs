import { defineConfig, type ViteUserConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['vitest.setup.ts'],
    include: ['**/*.test.?(c|m)[jt]s?(x)'],
    env: {
      IS_REACT_ACT_ENVIRONMENT: 'true'
    },
    server: {
      deps: {
        inline: ['vitest-package-exports']
      }
    },
    coverage: {
      provider: 'v8',
      exclude: [
        './src/adapters/**', // adapters are tested in e2e tests
        './tests/**.test-d.ts', // type tests don't generate coverage
        './**/*.d.ts' // neither do type definitions
      ]
    }
  }
})

export default config
