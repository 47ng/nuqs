import { Display } from 'e2e-shared/components/display'
import { ShallowUseQueryStates } from 'e2e-shared/specs/shallow'
import { useLoaderData, type LoaderFunctionArgs } from 'react-router'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  return {
    serverState: url.searchParams.get('test')
  }
}

export default function Page() {
  const { serverState } = useLoaderData<typeof loader>()
  return (
    <>
      <ShallowUseQueryStates />
      <Display environment="server" state={serverState} />
    </>
  )
}
