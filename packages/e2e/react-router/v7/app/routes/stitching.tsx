import { Stitching } from 'e2e-shared/specs/stitching'
import { loadOptions } from 'e2e-shared/specs/stitching.defs'
import type { LoaderFunctionArgs } from 'react-router'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function loader({ request }: LoaderFunctionArgs) {
  const { delay } = loadOptions(request)
  if (delay) {
    await wait(delay)
  }
  return null
}

export default Stitching
