import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { LinkProvider } from 'e2e-shared/components/link'
import { type Router, RouterProvider } from 'e2e-shared/components/router'
import type { AppProps } from 'next/app'
import Link from 'next/link'
import NextRouter from 'next/router'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'

// Using the imperative Router singleton (rather than the useRouter hook)
// keeps _app free of router subscriptions: a hook here would re-render the
// whole page tree on navigation and pollute render-count tests.
const router: Router = {
  replace(url, options) {
    NextRouter.replace(url, url, { shallow: options.shallow })
  },
  push(url, options) {
    NextRouter.push(url, url, { shallow: options.shallow })
  }
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <HydrationMarker />
      <NuqsAdapter>
        <LinkProvider Link={Link}>
          <RouterProvider router={router}>
            <Component {...pageProps} />
          </RouterProvider>
        </LinkProvider>
      </NuqsAdapter>
    </>
  )
}
