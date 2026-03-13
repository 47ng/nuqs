import { configurePlaywright } from 'e2e-shared/playwright.config.ts'

const isVinext = process.env.VINEXT === 'true'

export default configurePlaywright({
  startCommand: isVinext ? 'vinext start' : 'next start',
  port: 3001,
  basePath: process.env.BASE_PATH || '/'
})
