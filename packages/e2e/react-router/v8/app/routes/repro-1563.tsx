import { Repro1563 } from 'e2e-shared/specs/react-router/repro-1563'
import { countLoaderCall } from 'e2e-shared/specs/react-router/repro-1563.defs'
import { delayedLoader } from 'e2e-shared/specs/delay-loader.defs'
import {
  useNavigate,
  useNavigation,
  useNavigationType,
  useLoaderData,
  type LoaderFunctionArgs
} from 'react-router'

export async function loader({ request }: LoaderFunctionArgs) {
  const call = countLoaderCall(request)
  await delayedLoader(request)
  return call
}

export default function Page() {
  const loaderCall = useLoaderData<typeof loader>()
  return (
    <Repro1563
      loaderCall={loaderCall}
      useNavigate={useNavigate}
      useNavigation={useNavigation}
      useNavigationType={useNavigationType}
    />
  )
}
