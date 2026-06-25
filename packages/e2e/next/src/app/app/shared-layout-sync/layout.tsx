import { Suspense, type ReactNode } from 'react'
import { SharedFilter } from './SharedFilter'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <SharedFilter />
      {children}
    </Suspense>
  )
}
