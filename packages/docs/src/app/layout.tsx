import { Banner } from 'fumadocs-ui/components/banner'
import { RootProvider } from 'fumadocs-ui/provider'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Script from 'next/script'
import { NuqsAdapter } from 'nuqs/adapters/next'
import type { ReactNode } from 'react'
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
  ]
} satisfies Metadata

export default function Layout({ children }: { children: ReactNode }) {
  const enableChiffreAnalytics = process.env.VERCEL_ENV === 'production'
  return (
    <html lang="en" className={cn(inter.className, 'antialiased')}>
      <body>
        <Banner
          variant="rainbow"
          className="text-md gap-4 font-semibold"
          id="nuqs-2-announcement"
        >
          <span aria-hidden>🎉</span>
          <Link
            href="/blog/nuqs-2"
            className="decoration-slice decoration-1 transition-all hover:underline hover:underline-offset-8 focus-visible:underline focus-visible:outline-none"
            prefetch={false}
          >
            Announcing nuqs version 2
          </Link>
          <span aria-hidden>🎉</span>
        </Banner>
        <RootProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
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
