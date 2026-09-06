'use client'

import { Repro1501 as Repro1501Fixture } from 'e2e-shared/specs/repro-1501'
import { useRouter } from 'waku'

function useRouterValue() {
  const { query } = useRouter()
  return new URLSearchParams(query).get('folder')
}

export function Repro1501() {
  return <Repro1501Fixture useRouterValue={useRouterValue} />
}
