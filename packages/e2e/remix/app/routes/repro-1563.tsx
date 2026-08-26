import { Repro1563 } from 'e2e-shared/specs/react-router/repro-1563'
import {
  countLoaderCall,
  loadDelay
} from 'e2e-shared/specs/react-router/repro-1563.defs'
import type { LoaderFunctionArgs } from '@remix-run/node'
import {
  useLoaderData,
  useNavigate,
  useNavigation,
  useNavigationType
} from '@remix-run/react'

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
