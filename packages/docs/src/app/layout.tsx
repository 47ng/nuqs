import { GeistSans } from 'geist/font/sans'
import { RootProvider } from 'next-docs-ui/provider'
import 'next-docs-ui/style.css'
import type { ReactNode } from 'react'
import './globals.css'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
