const experimental =
  process.env.WINDOW_HISTORY_SUPPORT === 'true'
    ? {
        windowHistorySupport: true
      }
    : undefined

/** @type {import('next').NextConfig } */
const config = {
  basePath: process.env.BASE_PATH === '/' ? undefined : process.env.BASE_PATH,
  experimental
}

export default config
