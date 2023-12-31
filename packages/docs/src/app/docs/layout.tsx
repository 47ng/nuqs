import { NuqsWordmark } from '@/src/components/logo'
import { navItems } from '@/src/components/nav'
import { DocsLayout } from 'next-docs-ui/layout'
import type { ReactNode } from 'react'
import { tree } from '../source'

export default async function RootDocsLayout({
  children
}: {
  children: ReactNode
}) {
  const version = await getLatestVersion()
  return (
    <DocsLayout
      tree={tree}
      nav={{
        title: <NuqsWordmark />,
        items: navItems,
        githubUrl: 'https://github.com/47ng/next-usequerystate'
      }}
      sidebar={{
        collapsible: false,
        footer: (
          <footer className="flex w-full items-baseline gap-2 text-gray-600 dark:text-gray-400">
            <a
              href={`https://npmjs.com/package/next-usequerystate/v/${version}`}
              className="hover:underline"
              tabIndex={-1}
            >
              <pre className="text-xs">nuqs@{version}</pre>
            </a>
          </footer>
        )
      }}
    >
      {children}
    </DocsLayout>
  )
}

async function getLatestVersion() {
  const res = await fetch('https://registry.npmjs.org/next-usequerystate').then(
    r => r.json()
  )
  return res['dist-tags'].latest
}
