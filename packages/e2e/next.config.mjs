const basePath =
  process.env.BASE_PATH === '/' ? undefined : process.env.BASE_PATH

/** @type {import('next').NextConfig } */
const config = {
  basePath,
  experimental: {
    clientRouterFilter: false,
    ...(process.env.REACT_COMPILER === 'true' ? { reactCompiler: true } : {})
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
  basePath:       ${basePath}
  reactCompiler:  ${experimental?.reactCompiler ?? false}
`)

export default config
