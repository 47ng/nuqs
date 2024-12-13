import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import type { AppProps } from 'next/app'
import { NuqsAdapter } from 'nuqs/adapters/next/pages'

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <HydrationMarker />
      <NuqsAdapter>
        <Component {...pageProps} />
      </NuqsAdapter>
    </>
  )
}
