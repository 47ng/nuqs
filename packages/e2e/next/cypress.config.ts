import { defineConfig } from 'e2e-shared/cypress.config'

const basePath =
  process.env.BASE_PATH === '/' ? '' : (process.env.BASE_PATH ?? '')

export default defineConfig({
  baseUrl: `http://localhost:3001${basePath}`,
  env: {
    basePath
  }
})
