import { NuqsAdapter } from 'nuqs/adapters/next'
import type { ReactNode } from 'react'

export default function RouterAgnosticLayout({
  children
}: {
  children: ReactNode
}) {
  return <NuqsAdapter>{children}</NuqsAdapter>
}
