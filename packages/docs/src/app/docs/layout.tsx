import { source } from '@/src/app/source'
import { getSharedLayoutProps } from '@/src/components/shared-layout'
import { SidebarFooter } from '@/src/components/sidebar-footer'
import { DocsLayout } from 'fumadocs-ui/layouts/notebook'
import { Suspense, type ReactNode } from 'react'
import { SideBanner } from '../banners'

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  const shared = getSharedLayoutProps()

  return (
    <>
      <a
        href="#main-content"
        className="bg-background text-foreground focus-visible:ring-ring fixed top-2 left-40 z-50 -translate-y-20 rounded-md px-3 py-2 font-medium focus:translate-y-0 focus-visible:ring-2 focus-visible:outline-none"
      >
        Skip to content
      </a>
      <DocsLayout
        tree={source.pageTree}
        {...shared}
        nav={{ ...shared.nav, mode: 'top' }}
        sidebar={{
          collapsible: false,
          banner: SideBanner,
          footer: (
            <Suspense>
              <SidebarFooter />
            </Suspense>
          )
        }}
      >
        {children}
      </DocsLayout>
    </>
  )
}
