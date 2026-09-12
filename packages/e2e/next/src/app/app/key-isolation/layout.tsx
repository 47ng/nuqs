import { NuqsAdapter } from 'nuqs/adapters/next/app'
import type { ReactNode } from 'react'

// This segment-level adapter mirrors the unflagged root layout adapter.
// It keeps the bridge store alive across navigations between routes below.
// The root layout's unflagged adapter still wraps this adapter.
// The app router has no per-segment opt-out like skipNuqsAdapter.
export default function Layout({ children }: { children: ReactNode }) {
  return <NuqsAdapter experimental_keyIsolation>{children}</NuqsAdapter>
}
