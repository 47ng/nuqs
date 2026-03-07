// @ts-check

const basePath =
  process.env.BASE_PATH === '/' ? undefined : process.env.BASE_PATH

const enableCacheComponents =
  process.env.CACHE_COMPONENTS === 'true'
    ? {
        cacheComponents: true
      }
    : {}

/** @type {import('next').NextConfig } */
const config = {
  basePath,
  productionBrowserSourceMaps: true,
  ...enableCacheComponents,
  reactCompiler: process.env.REACT_COMPILER === 'true',
  experimental: {
    clientRouterFilter: false,
    serverSourceMaps: true
  },
  transpilePackages: ['e2e-shared'],
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
  basePath:        ${config.basePath}
  reactCompiler:   ${config.reactCompiler}
  cacheComponents: ${config.cacheComponents}
`)

export default config
