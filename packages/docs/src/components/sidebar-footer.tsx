'use client'

import { useEffect, useState } from 'react'

export function SidebarFooter() {
  const [version, setVersion] = useState<string | null>(null)
  useEffect(() => {
    getLatestVersion().then(setVersion).catch(console.error)
  }, [])
  if (!version) return null
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
