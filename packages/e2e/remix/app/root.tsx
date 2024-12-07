import { Links, Meta, Scripts, ScrollRestoration } from '@remix-run/react'
import { enableHistorySync, NuqsAdapter } from 'nuqs/adapters/remix'
import RootLayout from './layout'

enableHistorySync()

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <NuqsAdapter>
      <RootLayout />
    </NuqsAdapter>
  )
}
