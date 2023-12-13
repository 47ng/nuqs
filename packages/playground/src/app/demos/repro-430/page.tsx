'use client'

import { useQueryState } from 'next-usequerystate'
import Link from 'next/link'

export default function Home() {
  const [search, setSearch] = useQueryState('search')
  return (
    <main className="w-screen h-screen flex-col flex items-center justify-center gap-5">
      <h1>Home Page</h1>
      <Link
        href="/demos/repro-430/another"
        className="bg-gray-300 rounded-lg px-4 py-2"
      >
        Go to another page
      </Link>
      <h4>Search Query: {search}</h4>
      <input
        type="text"
        value={search ?? ''}
        onChange={e => setSearch(e.target.value)}
        className="border rounded px-2 py-1"
      />
    </main>
  )
}
