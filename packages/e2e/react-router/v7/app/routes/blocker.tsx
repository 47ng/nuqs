import { Blocker } from 'e2e-shared/specs/react-router/blocker'
import { delayedLoader } from 'e2e-shared/specs/delay-loader.defs'
import {
  useBlocker,
  useNavigate,
  useNavigation,
  type LoaderFunctionArgs
} from 'react-router'

export function loader({ request }: LoaderFunctionArgs) {
  return delayedLoader(request)
}

export default function Page() {
  return (
    <Blocker
      useBlocker={useBlocker}
      useNavigation={useNavigation}
      useNavigate={useNavigate}
    />
  )
}
