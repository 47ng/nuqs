const basePath =
  process.env.BASE_PATH === '/' ? undefined : process.env.BASE_PATH

/** @type {import('next').NextConfig } */
const config = {
  basePath,
  productionBrowserSourceMaps: true,
  experimental: {
    clientRouterFilter: false,
    ...(process.env.REACT_COMPILER === 'true' ? { reactCompiler: true } : {}),
    serverSourceMaps: true
  },
  rewrites: async () => [
    {
      source: '/app/rewrites/source',
      destination: '/app/rewrites/destination?injected=by+rewrites'
    },
    {
      source: '/app/rewrites/source/match-query',
      destination: '/app/rewrites/destination?injected=disallowed',
      has: [{ type: 'query', key: 'injected', value: 'blocked' }]
    }
  ]
}

console.info(`Next.js config:
  basePath:       ${config.basePath}
  reactCompiler:  ${config.experimental?.reactCompiler ?? false}
`)

export default config
