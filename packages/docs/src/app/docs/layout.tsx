import { source } from '@/src/app/source'
import { getSharedLayoutProps } from '@/src/components/shared-layout'
import { DocsLayout } from 'fumadocs-ui/layout'
import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      {...getSharedLayoutProps()}
      sidebar={{
        collapsible: false,
        banner: (
          <div className="my-2 flex justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-100/50 py-2.5 font-semibold dark:bg-blue-700/10">
            <span aria-hidden>🎉</span>
            <Link
              href="/blog/nuqs-2"
              className="text-blue-900 hover:underline focus-visible:underline focus-visible:outline-none dark:text-blue-100"
            >
              Announcing nuqs v2 !
            </Link>
            <span aria-hidden>🎉</span>
          </div>
        ),
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
    <footer className="flex w-full items-baseline gap-2 text-zinc-600 dark:text-zinc-400">
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
  try {
    const res = await fetch('https://registry.npmjs.org/nuqs', {
      next: {
        tags: ['npm']
      }
    }).then(r => r.json())
    return res['dist-tags'].latest
  } catch {
    return 'latest'
  }
}
