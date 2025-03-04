import { defineConfig } from 'vitest/config'

export default defineConfig({
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
    }
  }
})
