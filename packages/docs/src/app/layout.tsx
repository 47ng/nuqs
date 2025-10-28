import * as Sentry from '@sentry/nextjs'
import { RootProvider } from 'fumadocs-ui/provider/next'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Suspense, type ReactNode } from 'react'
import { ResponsiveHelper } from '../components/responsive-helpers'
import { cn } from '../lib/utils'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  fallback: ['sans-serif']
})

export const metadata = {
  title: {
    template: '%s | nuqs',
    default: 'nuqs'
  },
  description:
    'Type-safe search params state management for React. Like useState, but stored in the URL query string.',
  authors: [
    {
      name: 'François Best',
      url: 'https://francoisbest.com'
    }
  ],
  other: {
    ...Sentry.getTraceData()
  }
} satisfies Metadata

export default function Layout({ children }: { children: ReactNode }) {
  const enableChiffreAnalytics = process.env.VERCEL_ENV === 'production'
  return (
    <html
      lang="en"
      className={cn(inter.className, 'antialiased')}
      // https://github.com/shadcn-ui/ui/issues/5552#issuecomment-2435024526
      suppressHydrationWarning
    >
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          href="/blog/rss.xml"
          title="nuqs blog RSS feed"
        />
      </head>
      <body>
        {/* Top-level banners go here */}
        <RootProvider>
          <Suspense>
            <NuqsAdapter>{children}</NuqsAdapter>
          </Suspense>
        </RootProvider>
        {enableChiffreAnalytics && (
          <Script
            async
            id="chiffre:analytics"
            src="https://chiffre.io/analytics.js"
            data-chiffre-project-id="odWoaH0aUUwm42Wf"
            data-chiffre-public-key="pk.3EPMj_faODyzisb0UNmZnzhIkG9sbj7zR5em6lf7Olk"
            referrerPolicy="origin"
            crossOrigin="anonymous"
            data-chiffre-ignore-paths="/stats"
          />
        )}
        <ResponsiveHelper />
      </body>
    </html>
  )
}
