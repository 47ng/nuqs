import { Display } from 'e2e-shared/components/display'
import { ShallowUseQueryState } from 'e2e-shared/specs/shallow'
import { useLoaderData, type LoaderFunctionArgs } from 'react-router-dom'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  return {
    serverState: url.searchParams.get('test')
  }
}

export default function Page() {
  const { serverState } = useLoaderData() as Awaited<ReturnType<typeof loader>>
  return (
    <>
      <ShallowUseQueryState />
      <Display environment="server" state={serverState} />
    </>
  )
}
