// @ts-check

import { withSentryConfig } from '@sentry/nextjs'
import { createMDX } from 'fumadocs-mdx/next'

const withFumadocsMDX = createMDX()

const enableSentry =
  process.env.ENABLE_SENTRY === 'true' &&
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) &&
  Boolean(process.env.SENTRY_AUTH_TOKEN) &&
  ['production', 'preview'].includes(process.env.VERCEL_ENV ?? '')

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
  turbopack: {
    debugIds: enableSentry
  },
  experimental: {
    isolatedDevBuild: true
  },
  productionBrowserSourceMaps: enableSentry,
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
      },
      {
        source: '/docs/:path*.mdx',
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

/**
 * @type {import('@sentry/nextjs').SentryBuildOptions}
 */
const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  release: {
    setCommits: process.env.VERCEL_GIT_COMMIT_SHA
      ? {
          // https://github.com/getsentry/sentry-javascript-bundler-plugins/issues/443#issuecomment-1815988709
          repo: '47ng/nuqs',
          commit: process.env.VERCEL_GIT_COMMIT_SHA
        }
      : { auto: true }
  },

  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers. (increases server load)
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: '/sentry',

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  // disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors.
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,

  debug: false
}

if (enableSentry) {
  console.info('Sentry is enabled for this build.')
}

export default enableSentry
  ? withSentryConfig(withFumadocsMDX(config), sentryConfig)
  : withFumadocsMDX(config)
