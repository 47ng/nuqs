import { NuqsWordmark } from '@/src/components/logo'
import { navItems } from '@/src/components/nav'
import { DocsLayout } from 'next-docs-ui/layout'
import { Suspense, type ReactNode } from 'react'
import { tree } from '../source'

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={tree}
      nav={{
        title: <NuqsWordmark className="px-3" />,
        items: navItems,
        githubUrl: 'https://github.com/47ng/nuqs'
      }}
      sidebar={{
        collapsible: false,
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

async function SidebarFooter() {
  const version = await getLatestVersion()
  return (
    <footer className="flex w-full items-baseline gap-2 text-gray-600 dark:text-gray-400">
      <a
        href={`https://npmjs.com/package/nuqs/v/${version}`}
        className="hover:underline"
        tabIndex={-1}
      >
        <pre className="text-xs">nuqs@{version}</pre>
      </a>
    </footer>
  )
}

async function getLatestVersion() {
  const res = await fetch('https://registry.npmjs.org/nuqs').then(r => r.json())
  return res['dist-tags'].latest
}
