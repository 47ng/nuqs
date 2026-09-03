import { Stitching } from 'e2e-shared/specs/stitching'
import { delayedLoader } from 'e2e-shared/specs/delay-loader.defs'
import type { LoaderFunctionArgs } from '@remix-run/node'

export function loader({ request }: LoaderFunctionArgs) {
  return delayedLoader(request)
}

export default Stitching
