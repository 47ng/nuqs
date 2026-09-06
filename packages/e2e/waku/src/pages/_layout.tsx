import { NuqsAdapter } from 'nuqs/adapters/waku'
import type { ReactNode } from 'react'
import { Providers } from '../lib/providers'

type RootLayoutProps = { children: ReactNode }

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <NuqsAdapter>
      <Providers>{children}</Providers>
    </NuqsAdapter>
  )
}

export const getConfig = async () => {
  return {
    render: 'static'
  } as const
}
