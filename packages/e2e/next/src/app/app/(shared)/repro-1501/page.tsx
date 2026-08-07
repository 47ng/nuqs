'use client'

import { Repro1501 } from 'e2e-shared/specs/repro-1501'
import { useSearchParams } from 'next/navigation'

function useRouterValue() {
  return useSearchParams()?.get('folder') ?? null
}

export default function Page() {
  return <Repro1501 useRouterValue={useRouterValue} />
}
