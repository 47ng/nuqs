import type { ReactNode } from 'react'
import { NuqsAdapter } from '../lib/nuqs-waku-adapter'
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
