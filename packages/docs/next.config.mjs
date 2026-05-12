// @ts-check

import { createMDX } from 'fumadocs-mdx/next'

const withFumadocsMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  outputFileTracingIncludes: {
    '/playground/pagination': [
      './src/app/playground/(demos)/pagination/search-params.ts',
      './src/app/playground/(demos)/pagination/page.tsx',
      './src/app/playground/(demos)/pagination/pagination-controls.server.tsx',
      './src/app/playground/(demos)/pagination/pagination-controls.client.tsx'
    ]
  },
  reactCompiler: true,
  reactStrictMode: true,
  experimental: {
    isolatedDevBuild: true
  },
  redirects: async () => {
    return [
      {
        // Jump straight to the first page (no root index page)
        source: '/docs',
        destination: '/docs/installation',
        permanent: false
      },
      {
        source: '/docs/parsers/community',
        destination: '/docs/parsers/community/tanstack-table',
        permanent: false
      },
      {
        source: '/changelog', // Shorthand
        destination: '/docs/changelog',
        permanent: false
      },
      // Cool URLs don't break
      {
        source: '/docs/parsers',
        destination: '/docs/parsers/built-in',
        permanent: true
      },
      {
        source: '/docs/community-adapters/inertia',
        destination: '/registry/adapter-inertia',
        permanent: true
      },
      {
        source: '/docs/community-adapters/waku',
        destination: '/registry/adapter-waku',
        permanent: true
      },
      {
        source: '/docs/community-adapters/onejs',
        destination: '/registry/adapter-onejs',
        permanent: true
      },
      // Moved from err.47ng.com/NUQS-123
      {
        source: '/NUQS-:code(\\d{3})',
        destination:
          'https://github.com/47ng/nuqs/blob/next/errors/NUQS-:code.md',
        permanent: false
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/docs/:path*.md',
        destination: '/llms/:path*'
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/profile_images/**'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**'
      },
      {
        protocol: 'https',
        hostname: 'i.redd.it',
        pathname: '/snoovatar/avatars/**'
      }
    ]
  }
}

export default withFumadocsMDX(config)
