import type { LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigation } from '@remix-run/react'
import { PendingLoader } from 'e2e-shared/specs/react-router/pending-loader'
import {
  controlledLoader,
  readLoaderRequest
} from 'e2e-shared/specs/react-router/pending-loader.defs'

export function loader({ request }: LoaderFunctionArgs) {
  return readLoaderRequest(request)
}

export const clientLoader = controlledLoader

export default function Page() {
  const data = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  return <PendingLoader data={data} navigationState={navigation.state} />
}
