import { Repro1501 } from 'e2e-shared/specs/repro-1501'
import { useLocation } from 'react-router-dom'

function useRouterValue() {
  return new URLSearchParams(useLocation().search).get('folder')
}

export default function Page() {
  return <Repro1501 useRouterValue={useRouterValue} />
}
