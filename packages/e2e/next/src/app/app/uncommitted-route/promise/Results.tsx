'use client'

import { use } from 'react'

export function Results({ data }: { data: Promise<string> }) {
  return <p id="results">{use(data)}</p>
}
