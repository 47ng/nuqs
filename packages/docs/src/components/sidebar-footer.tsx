import { getPublishedVersion } from '@/src/lib/published-version'

export async function SidebarFooter() {
  const version = await getPublishedVersion()
  return (
    <footer className="ml-2 flex w-full items-baseline gap-2 text-zinc-600 dark:text-zinc-400">
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
