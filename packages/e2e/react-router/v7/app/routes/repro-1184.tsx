import { Repro1184 } from 'e2e-shared/specs/repro-1184'
import { repro1184Loader } from 'e2e-shared/specs/repro-1184.defs'
import type { LoaderFunctionArgs } from 'react-router'
import type { Route } from './+types/repro-1184'

export function loader({ request }: LoaderFunctionArgs) {
  return repro1184Loader(request)
}

export default function Page({ loaderData }: Route.ComponentProps) {
  return <Repro1184 serverCounter={loaderData.counter} />
}
