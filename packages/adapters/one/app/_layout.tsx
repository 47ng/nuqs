import { NuqsAdapter } from 'nuqs/adapters/one'
import { Slot } from 'one'

export default function Layout() {
  return (
    <>
      {typeof document !== 'undefined' && (
        <>
          <meta charSet="utf-8" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=5"
          />
          <link rel="icon" href="/favicon.svg" />
        </>
      )}
      <NuqsAdapter>
        <Slot />
      </NuqsAdapter>
    </>
  )
}
