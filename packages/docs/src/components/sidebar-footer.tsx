import { cacheLife, cacheTag } from 'next/cache'

export async function SidebarFooter() {
  'use cache'
  cacheLife('static')
  cacheTag('npm-version')
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
    const res = await fetch('https://registry.npmjs.org/nuqs').then(r =>
      r.json()
    )
    return res['dist-tags'].latest
  } catch {
    return 'latest'
  }
}
