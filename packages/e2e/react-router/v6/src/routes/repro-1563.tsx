import { Repro1563 } from 'e2e-shared/specs/react-router/repro-1563'
import { countLoaderCall } from 'e2e-shared/specs/react-router/repro-1563.defs'
import { delayedLoader } from 'e2e-shared/specs/delay-loader.defs'
import {
  type LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
  useNavigation,
  useNavigationType
} from 'react-router-dom'

export async function loader({ request }: LoaderFunctionArgs) {
  const call = countLoaderCall(request)
  await delayedLoader(request)
  return call
}

export default function Page() {
  const loaderCall = useLoaderData() as Awaited<ReturnType<typeof loader>>
  return (
    <Repro1563
      loaderCall={loaderCall}
      useNavigate={useNavigate}
      useNavigation={useNavigation}
      useNavigationType={useNavigationType}
    />
  )
}
