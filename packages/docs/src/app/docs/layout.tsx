import { NuqsWordmark } from '@/src/components/logo'
import { DocsLayout } from 'next-docs-ui/layout'
import { RootProvider } from 'next-docs-ui/provider'
import type { ReactNode } from 'react'
import '../globals.css'
import { tree } from '../source'

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  return (
    <RootProvider>
      <DocsLayout tree={tree} nav={{ title: <NuqsWordmark /> }}>
        {children}
      </DocsLayout>
    </RootProvider>
  )
}
