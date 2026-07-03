import { Repro1184 } from 'e2e-shared/specs/repro-1184'
import { repro1184Loader } from 'e2e-shared/specs/repro-1184.defs'
import { useLoaderData, type LoaderFunctionArgs } from 'react-router-dom'

export function loader({ request }: LoaderFunctionArgs) {
  return repro1184Loader(request)
}

export default function Page() {
  const { counter } = useLoaderData() as Awaited<ReturnType<typeof loader>>
  return <Repro1184 serverCounter={counter} />
}
