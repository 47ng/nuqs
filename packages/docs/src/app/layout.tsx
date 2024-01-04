import type { Metadata } from 'next'
import { RootProvider } from 'next-docs-ui/provider'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

const inter = Inter({
  subsets: ['latin']
})

export const metadata = {
  title: {
    template: '%s | nuqs',
    default: 'nuqs'
  },
  description:
    'Type-safe search params state management for Next.js. Like React.useState, but stored in the URL query string.',
  authors: [
    {
      name: 'François Best',
      url: 'https://francoisbest.com'
    }
  ]
} satisfies Metadata

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
