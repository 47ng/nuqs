import { RenderCount } from 'e2e-shared/specs/render-count'
import { loadParams } from 'e2e-shared/specs/render-count.params'
import { useParams } from 'react-router-dom'

export function loader() {
  return null
}

export default function Page() {
  const params = loadParams(useParams())
  return <RenderCount {...params} />
}
