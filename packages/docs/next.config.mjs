import { withSentryConfig } from '@sentry/nextjs'
import createNextDocsMDX from 'next-docs-mdx/config'
import remarkGitHub from 'remark-github'
import remarkMdxImages from 'remark-mdx-images'
import remarkSmartypants from 'remark-smartypants'

const withFumaMDX = createNextDocsMDX({
  mdxOptions: {
    remarkPlugins: [remarkMdxImages, remarkGitHub, remarkSmartypants]
  }
})

/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    outputFileTracingIncludes: {
      '/playground/pagination': [
        './src/app/playground/(demos)/pagination/searchParams.ts',
        './src/app/playground/(demos)/pagination/page.tsx',
        './src/app/playground/(demos)/pagination/pagination-controls.server.tsx',
        './src/app/playground/(demos)/pagination/pagination-controls.client.tsx'
      ]
    }
  },
  reactStrictMode: true,
  redirects: async () => {
    return [
      {
        source: '/docs',
        destination: '/docs/installation',
        permanent: false
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

const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  org: '47ng',
  project: 'nuqs'
}

const sentryOptions = {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: true,

  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers. (increases server load)
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: '/sentry',

  hideSourceMaps: false,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors.
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true
}

export default withSentryConfig(
  withFumaMDX(config),
  sentryConfig,
  sentryOptions
)
