import type { LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { ShallowUseQueryState } from 'e2e-shared/specs/shallow'
import { ShallowDisplay } from 'e2e-shared/specs/shallow-display'

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
      <ShallowUseQueryState />
      <ShallowDisplay environment="server" state={serverState} />
    </>
  )
}
