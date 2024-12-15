import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { LinkProvider } from 'e2e-shared/components/link'
import { type Router, RouterProvider } from 'e2e-shared/components/router'
import type { AppProps } from 'next/app'
import Link from 'next/link'
import { useRouter as useNextRouter } from 'next/router'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <HydrationMarker />
      <NuqsAdapter>
        <LinkProvider Link={Link}>
          <RouterProvider useRouter={useRouter}>
            <Component {...pageProps} />
          </RouterProvider>
        </LinkProvider>
      </NuqsAdapter>
    </>
  )
}

function useRouter(): Router {
  const router = useNextRouter()
  return {
    replace(url, options) {
      router.replace(url, url, { shallow: options.shallow })
    },
    push(url, options) {
      router.push(url, url, { shallow: options.shallow })
    }
  }
}
