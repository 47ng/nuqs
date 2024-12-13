import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HydrationMarker />
      {children}
    </>
  )
}
