import { defineConfig } from 'e2e-shared/cypress.config'

export default defineConfig({
  baseUrl: 'http://localhost:3002',
  env: {
    fullPageNavOnShallowFalse:
      process.env.FULL_PAGE_NAV_ON_SHALLOW_FALSE === 'true'
  }
})
