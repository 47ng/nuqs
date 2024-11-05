'use client'

import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates
} from 'nuqs'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  )
}

function Client() {
  const [{ searchQuery, pageNumber, activeTags }, setURLState] = useQueryStates(
    {
      searchQuery: parseAsString.withDefault(''),
      pageNumber: parseAsInteger.withDefault(1),
      activeTags: parseAsArrayOf(parseAsString).withDefault([])
    },
    {
      urlKeys: {
        searchQuery: 'q',
        pageNumber: 'page',
        activeTags: 'tags'
      }
    }
  )

  return (
    <>
      <label style={{ display: 'block' }}>
        <input
          id="search"
          value={searchQuery}
          onChange={e => setURLState({ searchQuery: e.target.value })}
        />
        <span>Search</span>
      </label>
      <label style={{ display: 'block' }}>
        <input
          id="page"
          type="number"
          min={1}
          max={5}
          step={1}
          value={pageNumber}
          onChange={e => setURLState({ pageNumber: e.target.valueAsNumber })}
        />
        <span>Page</span>
      </label>
      <label style={{ display: 'block' }}>
        <label>
          <input
            id="react"
            type="checkbox"
            checked={activeTags.includes('react')}
            onChange={e =>
              setURLState(old => ({
                activeTags: e.target.checked
                  ? [...old.activeTags, 'react']
                  : old.activeTags.filter(tag => !tag.includes('react'))
              }))
            }
          />
          React SPA
        </label>
        <label>
          <input
            id="nextjs"
            type="checkbox"
            checked={activeTags.includes('next.js')}
            onChange={e =>
              setURLState(old => ({
                activeTags: e.target.checked
                  ? [...old.activeTags, 'next.js']
                  : old.activeTags.filter(tag => !tag.includes('next.js'))
              }))
            }
          />
          Next.js
        </label>
      </label>
    </>
  )
}
