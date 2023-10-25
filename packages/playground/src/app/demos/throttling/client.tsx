'use client'

import { parseAsString, useQueryState } from 'src/nuqs'

export function Client() {
  const [q, setQ] = useQueryState(
    'q',
    parseAsString
      .withOptions({ throttleMs: 350, shallow: false })
      .withDefault('')
  )

  return (
    <>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search"
      />
      <p>Query: {q || <em>empty</em>}</p>
    </>
  )
}
