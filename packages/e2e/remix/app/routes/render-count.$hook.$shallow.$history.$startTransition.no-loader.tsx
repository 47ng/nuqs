import { useParams } from '@remix-run/react'
import { RenderCount } from 'e2e-shared/specs/render-count'
import { loadParams } from 'e2e-shared/specs/render-count.params'

export default function Page() {
  const params = loadParams(useParams())
  return <RenderCount {...params} />
}
