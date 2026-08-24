import { Repro1563 } from 'e2e-shared/specs/react-router/repro-1563'
import {
  countLoaderCall,
  loadDelay
} from 'e2e-shared/specs/react-router/repro-1563.defs'
import {
  type LoaderFunctionArgs,
  useLoaderData,
  useNavigation,
  useNavigationType
} from 'react-router-dom'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function loader({ request }: LoaderFunctionArgs) {
  const call = countLoaderCall(request)
  const { delay } = loadDelay(request)
  if (delay) {
    await wait(delay)
  }
  return call
}

export default function Page() {
  const loaderCall = useLoaderData() as Awaited<ReturnType<typeof loader>>
  return (
    <Repro1563
      loaderCall={loaderCall}
      useNavigation={useNavigation}
      useNavigationType={useNavigationType}
    />
  )
}
