import { Blocker } from 'e2e-shared/specs/react-router/blocker'
import { delayedLoader } from 'e2e-shared/specs/delay-loader.defs'
import {
  Form,
  Link,
  useBlocker,
  useNavigate,
  useNavigation,
  type LoaderFunctionArgs
} from 'react-router'

export function loader({ request }: LoaderFunctionArgs) {
  return delayedLoader(request)
}

export { loader as action }

export default function Page() {
  return (
    <>
      <Link id="router-slow-link" to="?count=3&delay=1000">
        Slow router Link
      </Link>
      <Form method="post" action="?count=3&delay=1000">
        <button id="router-slow-submit" type="submit">
          Slow router submission
        </button>
      </Form>
      <Blocker
        useBlocker={useBlocker}
        useNavigation={useNavigation}
        useNavigate={useNavigate}
      />
    </>
  )
}
