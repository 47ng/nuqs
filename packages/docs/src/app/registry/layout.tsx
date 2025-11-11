import { getSharedLayoutProps } from '@/src/components/shared-layout'
import { SidebarFooter } from '@/src/components/sidebar-footer'
import { categorizeRegistryItems, readRegistry } from '@/src/registry/read'
import { DocsLayout } from 'fumadocs-ui/layouts/notebook'
import { Suspense, type ReactNode } from 'react'

export default async function RegistryLayout({
  children
}: {
  children: ReactNode
}) {
  const sharedLayoutProps = getSharedLayoutProps()
  const registry = await readRegistry()
  const categories = categorizeRegistryItems(registry)
  return (
    <>
      <DocsLayout
        tree={{
          $id: 'root',
          name: 'Registry',
          children: [
            {
              $id: '#introduction-heading',
              type: 'page',
              name: 'Shadcn Registry',
              url: '/registry',
              description:
                'Use the shadcn CLI to install custom parsers, adapters and utilities from the community.'
            },
            {
              $id: '#adapters-heading',
              type: 'separator',
              name: 'Adapters'
            },
            ...categories.Adapters.map(item => ({
              $id: `#${item.name}`,
              type: 'page' as const,
              name: item.title.replace(/adapter/gi, '').trim(),
              url: `/registry/${item.name}`,
              description: item.description
            })),
            // todo: Enable this when we have parsers
            // {
            //   $id: '#parsers-heading',
            //   type: 'separator',
            //   name: 'Parsers'
            // },
            // ...categories.Parsers.map(item => ({
            //   $id: `#${item.name}`,
            //   type: 'page' as const,
            //   name: item.title,
            //   url: `/registry/${item.name}`,
            //   description: item.description
            // })),
            {
              $id: '#utilities-heading',
              type: 'separator',
              name: 'Utilities'
            },
            ...categories.Utilities.map(item => ({
              $id: `#${item.name}`,
              type: 'page' as const,
              name: item.title,
              url: `/registry/${item.name}`,
              description: item.description
            }))
          ]
        }}
        {...sharedLayoutProps}
        nav={{ ...sharedLayoutProps.nav, mode: 'top' }}
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
    </>
  )
}
