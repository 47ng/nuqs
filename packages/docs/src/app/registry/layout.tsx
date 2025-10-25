import { getSharedLayoutProps } from '@/src/components/shared-layout'
import { DocsLayout } from 'fumadocs-ui/layouts/notebook'
import { DocsBody, DocsPage } from 'fumadocs-ui/page'
import type { ReactNode } from 'react'
import { readRegistry } from './_lib/read'

export default async function RegistryLayout({
  children
}: {
  children: ReactNode
}) {
  const shared = getSharedLayoutProps()
  const registry = await readRegistry()
  return (
    <>
      <DocsLayout
        tree={{
          name: 'Registry',
          children: registry.items.map(item => ({
            type: 'page',
            url: `#${item.name}`,
            name: item.title,
            description: item.description
          }))
        }}
        {...shared}
        nav={{ ...shared.nav, mode: 'top' }}
      >
        <DocsPage>
          <DocsBody>{children}</DocsBody>
        </DocsPage>
      </DocsLayout>
    </>
  )
}
