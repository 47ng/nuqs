const experimental =
  process.env.WINDOW_HISTORY_SUPPORT === 'true'
    ? {
        windowHistorySupport: true,
        clientRouterFilter: false
      }
    : {
        clientRouterFilter: false
      }

const basePath =
  process.env.BASE_PATH === '/' ? undefined : process.env.BASE_PATH

/** @type {import('next').NextConfig } */
const config = {
  basePath,
  experimental,
  rewrites: async () => [
    {
      source: '/app/rewrites/source',
      destination: '/app/rewrites/destination?injected=by+rewrites'
    }
  ]
}

console.info(`Next.js config:
  basePath:             ${basePath}
  windowHistorySupport: ${experimental?.windowHistorySupport ?? false}
`)

export default config
