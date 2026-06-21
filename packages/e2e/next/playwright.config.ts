import { configurePlaywright } from 'e2e-shared/playwright.config.ts'

export default configurePlaywright({
  startCommand: 'next start',
  port: 3001,
  basePath: process.env.BASE_PATH || '/'
})
