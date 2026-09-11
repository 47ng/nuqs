import { RedirectQueue } from 'e2e-shared/specs/react-router/redirect-queue'
import {
  readRedirectQueueRequest,
  redirectQueueLoader
} from 'e2e-shared/specs/react-router/redirect-queue.defs'
import {
  useLoaderData,
  useNavigation,
  type LoaderFunctionArgs
} from 'react-router'

export function loader({ request }: LoaderFunctionArgs) {
  return readRedirectQueueRequest(request)
}

export const clientLoader = redirectQueueLoader

export default function Page() {
  const data = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  return <RedirectQueue data={data} navigationState={navigation.state} />
}
