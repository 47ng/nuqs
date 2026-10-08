import { Repro1563 } from 'e2e-shared/specs/react-router/repro-1563'
import { countLoaderCall } from 'e2e-shared/specs/react-router/repro-1563.defs'
import { delayedLoader } from 'e2e-shared/specs/delay-loader.defs'
import {
  Link,
  redirect,
  useBlocker,
  type LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
  useNavigation,
  useNavigationType
} from 'react-router-dom'

export async function loader({ request }: LoaderFunctionArgs) {
  const call = countLoaderCall(request)
  await delayedLoader(request)
  const url = new URL(request.url)
  if (
    url.searchParams.has('redirect') &&
    url.searchParams.get('test') === 'pass'
  ) {
    url.searchParams.set('test', 'redirected')
    url.searchParams.delete('delay')
    throw redirect('/repro-1563' + url.search)
  }
  return { call, state: url.searchParams.get('test') }
}

export default function Page() {
  const { call, state } = useLoaderData() as Awaited<ReturnType<typeof loader>>
  return (
    <>
      <Repro1563
        loaderCall={call}
        loaderState={state}
        useBlocker={useBlocker}
        useNavigate={useNavigate}
        useNavigation={useNavigation}
        useNavigationType={useNavigationType}
      />
      <Link id="router-redirect-link" to="?test=pass&redirect=true">
        Router redirect
      </Link>
      <Link id="router-link" to="/">
        Router link
      </Link>
    </>
  )
}
