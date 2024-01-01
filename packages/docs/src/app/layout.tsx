import { RootProvider } from 'next-docs-ui/provider'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

const inter = Inter({
  subsets: ['latin']
})

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
