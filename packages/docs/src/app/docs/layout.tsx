import { source } from '@/src/app/source'
import { getSharedLayoutProps } from '@/src/components/shared-layout'
import { SidebarFooter } from '@/src/components/sidebar-footer'
import { DocsLayout } from 'fumadocs-ui/layouts/notebook'
import { Suspense, type ReactNode } from 'react'

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  const shared = getSharedLayoutProps()

  return (
    <DocsLayout
      tree={source.pageTree}
      {...shared}
      nav={{ ...shared.nav, mode: 'top' }}
      sidebar={{
        collapsible: false,
        // banner: // note: side banner goes here
        footer: (
          <Suspense>
            <SidebarFooter />
          </Suspense>
        )
      }}
    >
      {children}
    </DocsLayout>
  )
}
