import { useSearchParams } from '@remix-run/react'
import { parseAsString, useQueryState } from 'nuqs'
import { useOptimisticSearchParams } from 'nuqs/adapters/remix'

export async function loader({ request }: { request: Request }) {
  if (URL.canParse(request.url)) {
    console.log(new URL(request.url).search)
  }
  return null
}

export default function Component() {
  const [shallow, setShallow] = useQueryState(
    'shallow',
    parseAsString.withDefault('')
  )
  const [deep, setDeep] = useQueryState(
    'deep',
    parseAsString.withDefault('').withOptions({
      shallow: false,
      throttleMs: 100
    })
  )
  const [searchParams] = useSearchParams()
  const optimistic = useOptimisticSearchParams()
  return (
    <>
      <input
        value={shallow}
        placeholder="Shallow"
        onChange={e => setShallow(e.target.value)}
        className="block"
      />
      <input
        value={deep}
        placeholder="Deep"
        onChange={e => setDeep(e.target.value)}
        className="block"
      />
      <pre>
        Remix useSearchParams:
        <br />
        {renderSearchParams(searchParams)}
      </pre>
      <pre>
        nuqs useOptimisticSearchParams:
        <br />
        {renderSearchParams(optimistic)}
      </pre>
    </>
  )
}

function renderSearchParams(searchParams: URLSearchParams) {
  return JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)
}
