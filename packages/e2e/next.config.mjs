const experimental =
  process.env.WINDOW_HISTORY_SUPPORT === 'true'
    ? {
        windowHistorySupport: true
      }
    : undefined

const basePath =
  process.env.BASE_PATH === '/' ? undefined : process.env.BASE_PATH

/** @type {import('next').NextConfig } */
const config = {
  basePath,
  experimental
}

console.info(`Next.js config:
  basePath:             ${basePath}
  windowHistorySupport: ${experimental?.windowHistorySupport ?? false}
`)

export default config
