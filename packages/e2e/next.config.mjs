/** @type {import('next').NextConfig } */
const config = {
  basePath: process.env.BASE_PATH === '/' ? undefined : process.env.BASE_PATH,
  experimental: {
    windowHistorySupport:
      process.env.WINDOW_HISTORY_SUPPORT === 'true' || undefined
  }
}

export default config
