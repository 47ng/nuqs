import { ShallowUseQueryStates } from 'e2e-shared/specs/shallow'
import { ShallowDisplay } from 'e2e-shared/specs/shallow-display'
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
      <ShallowDisplay environment="server" state={serverState} />
    </>
  )
}
