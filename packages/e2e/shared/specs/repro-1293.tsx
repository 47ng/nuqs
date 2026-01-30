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
const useCount = () => useQueryStates(searchParams)[0].count

export function Repro1293PageA({ linkHref }: Props) {
  const count = useCount()
  console.log(`a: ${count}`)
  const Link = useLink()
  const href = serialize(linkHref, { count: 1 })
  return <Link href={href}>Go to Page B</Link>
}

export function Repro1293PageB() {
  const count = useCount()
  console.log(`b: ${count}`)
  return <button onClick={() => history.back()}>Go back</button>
}
