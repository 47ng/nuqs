import { experimental_createAsyncSearchParamsCache } from 'nuqs/experimental-async-cache'
import { parseAsInteger, parseAsString, SearchParams } from 'nuqs/server'
import { Suspense } from 'react'

const cache = experimental_createAsyncSearchParamsCache({
  foo: parseAsString.withDefault(''),
  bar: parseAsInteger.withDefault(0)
})

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function Page(props: PageProps) {
  cache.load(props.searchParams)
  return (
    <>
      <p>Page (this should pre-render)</p>
      <Suspense fallback={<p>Loading foo...</p>}>
        <Foo />
      </Suspense>
      <Suspense fallback={<p>Loading bar...</p>}>
        <Bar />
      </Suspense>
      <Suspense fallback={<p>Loading all...</p>}>
        <All />
      </Suspense>
    </>
  )
}

async function Foo() {
  const foo = await cache.get('foo')
  return <p>Foo: {foo}</p>
}

async function Bar() {
  const bar = await cache.get('bar')
  return <p>Bar: {bar}</p>
}

async function All() {
  const all = await cache.all()
  return <p>All: {JSON.stringify(all)}</p>
}
