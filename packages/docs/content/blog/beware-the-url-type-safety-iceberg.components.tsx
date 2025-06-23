'use client'

import { useState } from 'react'

const states = {
  pagination: {
    pageIndex: 1,
    pageSize: 50
  },
  filters: [
    {
      id: 'genre',
      value: 'fantasy'
    }
  ],
  orderBy: {
    id: 'releaseYear',
    desc: false
  }
}

const passThrough = <T,>(x: T) => x

export function URLComparison() {
  const [highlight, setHighlight] = useState(false)
  const [encoding, setEncoding] = useState(true)
  const keyClass = highlight ? 'text-pink-700 dark:text-pink-400' : ''
  const valueClass = highlight ? 'text-sky-700 dark:text-sky-400' : ''
  const encode = encoding ? encodeURIComponent : passThrough
  return (
    <div className="rounded-md border border-dashed px-2 pt-2">
      <div className="flex gap-4 pl-1 text-sm">
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={highlight}
            onChange={e => setHighlight(e.target.checked)}
          />
          Highlighting
        </label>
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={encoding}
            onChange={e => setEncoding(e.target.checked)}
          />
          Encoding
        </label>
      </div>
      <ol className="space-y-4">
        <li className="break-all">
          {'https://example.com'}?<span className={keyClass}>page</span>=
          <span className={valueClass}>1</span>&
          <span className={keyClass}>size</span>=
          <span className={valueClass}>50</span>&
          <span className={keyClass}>filters</span>=
          <span className={valueClass}>genre:fantasy</span>&
          <span className={keyClass}>sort</span>=
          <span className={valueClass}>releaseYear:asc</span>
        </li>
        <li className="break-all">
          {'https://example.com'}?<span className={keyClass}>pagination</span>=
          <span className={valueClass}>
            {encode(JSON.stringify(states.pagination))}
          </span>
          &<span className={keyClass}>filters</span>=
          <span className={valueClass}>
            {encode(JSON.stringify(states.filters))}
          </span>
          &<span className={keyClass}>orderBy</span>=
          <span className={valueClass}>
            {encode(JSON.stringify(states.orderBy))}
          </span>
        </li>
      </ol>
    </div>
  )
}
