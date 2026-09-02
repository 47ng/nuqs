import { defineConfig, type ViteUserConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
  test: {
    environment: 'node',
    reporters: ['default'],
    setupFiles: ['vitest.setup.ts'],
    include: ['src/**/*.test.?(c|m)[jt]s?(x)'],
    exclude: ['src/**/*.browser.test.?(c|m)[jt]s?(x)']
  }
})

export default config
