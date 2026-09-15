import { Repro1563 } from 'e2e-shared/specs/react-router/repro-1563'
import { delayedLoader } from 'e2e-shared/specs/delay-loader.defs'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { useNavigationType } from '@remix-run/react'

export function loader({ request }: LoaderFunctionArgs) {
  return delayedLoader(request)
}

export default function Page() {
  return <Repro1563 useNavigationType={useNavigationType} />
}
