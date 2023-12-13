'use client'

import { useQueryState } from 'next-usequerystate'
import Link from 'next/link'

export default function AnotherPage() {
  const [search, setSearch] = useQueryState('search')
  return (
    <main>
      <h1>Another Page</h1>
      <Link href="/">Go to Home page</Link>
      <h4>Search Query: {search}</h4>
      <input
        type="text"
        value={search ?? ''}
        onChange={e => setSearch(e.target.value)}
      />
    </main>
  )
}
