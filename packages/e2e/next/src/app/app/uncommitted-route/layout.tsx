import { Suspense, type ReactNode } from 'react'
import { FilterBar } from './FilterBar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Suspense>
      <FilterBar />
      {children}
    </Suspense>
  )
}
