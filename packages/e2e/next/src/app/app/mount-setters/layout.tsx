import { Suspense, type ReactNode } from 'react'
import { NavTracker } from './NavTracker'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <NavTracker />
      {children}
    </Suspense>
  )
}
