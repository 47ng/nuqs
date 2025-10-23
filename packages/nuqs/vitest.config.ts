import { defineConfig, type ViteUserConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['vitest.setup.ts'],
    include: ['**/*.test.?(c|m)[jt]s?(x)'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/adapters/**'] // Covered by e2e tests
    },
    env: {
      IS_REACT_ACT_ENVIRONMENT: 'true'
    },
    server: {
      deps: {
        inline: ['vitest-package-exports']
      }
    }
  }
})

export default config
