import { RenderCount } from 'e2e-shared/specs/render-count'
import {
  loadParams,
  loadSearchParams
} from 'e2e-shared/specs/render-count.params'

import { useParams, type LoaderFunctionArgs } from 'react-router-dom'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function loader({ request }: LoaderFunctionArgs) {
  const { delay } = loadSearchParams(request)
  if (delay) {
    await wait(delay)
  }
  return null
}

export default function Page() {
  const params = loadParams(useParams())
  return <RenderCount {...params} />
}
