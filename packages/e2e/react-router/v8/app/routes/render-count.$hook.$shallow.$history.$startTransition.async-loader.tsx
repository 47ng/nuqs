import { RenderCount } from 'e2e-shared/specs/render-count'
import {
  loadParams,
  loadSearchParams
} from 'e2e-shared/specs/render-count.params'
import { setTimeout } from 'node:timers/promises'
import { useParams, type LoaderFunctionArgs } from 'react-router'

export async function loader({ request }: LoaderFunctionArgs) {
  const { delay } = loadSearchParams(request)
  if (delay) {
    await setTimeout(delay)
  }
  return null
}

export default function Page() {
  const params = loadParams(useParams())
  return <RenderCount {...params} />
}
