import { defineConfig } from 'cypress'
import nextConfig from './next.config.mjs'

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:3000${nextConfig.basePath ?? ''}`,
    video: false,
    fixturesFolder: false,
    supportFile: false,
    testIsolation: true,
    retries: 5
  }
})
