import { Stitching } from 'e2e-shared/specs/stitching'
import { delayedLoader } from 'e2e-shared/specs/delay-loader.defs'
import type { LoaderFunctionArgs } from 'react-router'

export function loader({ request }: LoaderFunctionArgs) {
  return delayedLoader(request)
}

export default Stitching
