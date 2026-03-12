import { playwright } from '@vitest/browser-playwright'
import { defineConfig, type ViteUserConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
  define: {
    /**
     * We need to polyfill process.env because it is not meant to exist by default in a browser.
     * @see https://github.com/vitest-dev/vitest/issues/6872
     */
    'process.env': JSON.stringify({})
  },
  test: {
    setupFiles: ['vitest.setup.ts'],
    exclude: ['node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        './src/adapters/**', // adapters are tested in e2e tests
        './tests/**.test-d.ts', // type tests don't generate coverage
        './**/*.d.ts' // neither do type definitions
      ]
    },
    env: {
      IS_REACT_ACT_ENVIRONMENT: 'true'
    },
    server: {
      deps: {
        inline: ['vitest-package-exports']
      }
    },
    projects: [
      {
        extends: true,
        test: {
          setupFiles: ['vitest.setup.ts', 'vitest.browser.setup.ts'],
          name: 'browser',
          include: ['**/*.browser.test.?(c|m)[jt]s?(x)'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false
          }
        }
      },
      {
        // Tests that are meant to work in a non-browser environment.
        extends: true,
        test: {
          environment: 'node',
          name: 'unit',
          include: ['**/*.test.?(c|m)[jt]s?(x)'],
          exclude: ['**/*.browser.test.?(c|m)[jt]s?(x)']
        }
      },
      {
        extends: true,
        test: {
          name: 'types',
          typecheck: {
            enabled: true,
            only: true
          }
        }
      }
    ]
  }
})

export default config
