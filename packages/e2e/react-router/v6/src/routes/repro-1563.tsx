import { Repro1563 } from 'e2e-shared/specs/react-router/repro-1563'
import { loadDelay } from 'e2e-shared/specs/react-router/repro-1563.defs'
import { useNavigationType, type LoaderFunctionArgs } from 'react-router-dom'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function loader({ request }: LoaderFunctionArgs) {
  const { delay } = loadDelay(request)
  if (delay) {
    await wait(delay)
  }
  return null
}

export default function Page() {
  return <Repro1563 useNavigationType={useNavigationType} />
}
