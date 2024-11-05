'use client'

import { useQueryStates } from 'nuqs'
import { searchParams } from './searchParams'

export function RewriteDestinationClient() {
  const [{ injected, through }] = useQueryStates(searchParams)
  return (
    <>
      <p>
        Injected (client): <span id="injected-client">{injected}</span>
      </p>
      <p>
        Through (client): <span id="through-client">{through}</span>
      </p>
    </>
  )
}
