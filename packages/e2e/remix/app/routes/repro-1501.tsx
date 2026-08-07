import { useSearchParams } from '@remix-run/react'
import { Repro1501 } from 'e2e-shared/specs/repro-1501'

function useRouterValue() {
  return useSearchParams()[0].get('folder')
}

export default function Page() {
  return <Repro1501 useRouterValue={useRouterValue} />
}
