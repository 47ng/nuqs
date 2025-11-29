'use client'

import { Suspense, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { LiveTab } from './live-tab'

export interface DemoPaths {
  [demoName: string]: string
}

export interface DemoTabsWrapperProps {
  children: ReactNode
  demoPaths: DemoPaths
  demoTabLabel?: string
  liveTabLabel?: string
  getDemoName?: (pathname: string) => string
}

export function DemoTabsWrapper({
  children,
  demoPaths,
  demoTabLabel = 'Demo',
  liveTabLabel = 'Live',
  getDemoName = (pathname) => pathname?.split('/').pop() ?? '',
}: DemoTabsWrapperProps) {
  const pathname = usePathname()
  const demoName = getDemoName(pathname ?? '')
  const clientPath = demoPaths[demoName]

  if (!clientPath) return <>{children}</>

  return (
    <Tabs key={demoName} items={[demoTabLabel, liveTabLabel]} defaultIndex={0}>
      <Tab value={demoTabLabel}>
        <Suspense>{children}</Suspense>
      </Tab>
      <Tab value={liveTabLabel}>
        <Suspense fallback={<div>Loading...</div>}>
          <LiveTab demoPath={clientPath} />
        </Suspense>
      </Tab>
    </Tabs>
  )
}

