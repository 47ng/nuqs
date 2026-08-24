import { Repro1563 } from 'e2e-shared/specs/react-router/repro-1563'
import { loadDelay } from 'e2e-shared/specs/react-router/repro-1563.defs'
import {
  useNavigation,
  useNavigationType,
  useLoaderData,
  type LoaderFunctionArgs
} from 'react-router'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
let loaderCall = 0

export async function loader({ request }: LoaderFunctionArgs) {
  const call = ++loaderCall
  const { delay } = loadDelay(request)
  if (delay) {
    await wait(delay)
  }
  return call
}

export default function Page() {
  const loaderCall = useLoaderData<typeof loader>()
  return (
    <Repro1563
      loaderCall={loaderCall}
      useNavigation={useNavigation}
      useNavigationType={useNavigationType}
    />
  )
}
