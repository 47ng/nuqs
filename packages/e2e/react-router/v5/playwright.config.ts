import { configurePlaywright } from 'e2e-shared/playwright.config.ts'

export default configurePlaywright({
  startCommand: 'pnpm run start',
  port: 3005
})
