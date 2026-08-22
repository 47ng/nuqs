import { defineConfig, type ViteUserConfig } from 'vitest/config'
import baseConfig from './vitest.config'

const config: ViteUserConfig = defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    reporters: ['default']
  }
})

export default config
