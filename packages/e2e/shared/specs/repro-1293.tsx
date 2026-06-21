'use client'

import { createSerializer, parseAsInteger, useQueryStates } from 'nuqs'
import { useLink } from '../components/link'

type Props = {
  linkHref: string
}

const searchParams = {
  count: parseAsInteger.withDefault(0)
}
const serialize = createSerializer(searchParams)

export function Repro1293PageA({ linkHref }: Props) {
  const [{ count }, setSearchParams] = useQueryStates(searchParams)
  console.log(`a: ${count}`)
  const Link = useLink()
  const href = serialize(linkHref, { count: count + 1 })
  return (
    <>
      <button onClick={() => setSearchParams({ count: count + 1 })}>
        Increment
      </button>

      <Link href={href}>Go to Page B</Link>
    </>
  )
}

export function Repro1293PageB() {
  const [{ count }, setSearchParams] = useQueryStates(searchParams)
  console.log(`b: ${count}`)
  return (
    <>
      <button onClick={() => setSearchParams({ count: count + 1 })}>
        Increment
      </button>
      <button onClick={() => history.back()}>Go back</button>
    </>
  )
}
