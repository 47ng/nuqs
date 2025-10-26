import { defineConfig, type ViteUserConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
  test: {
    typecheck: {
      tsconfig: './tsconfig.json'
    }
  }
})

export default config
