'use client'

import { createSerializer, parseAsInteger, useQueryStates } from 'nuqs'
import { useEffect } from 'react'
import { useLink } from '../components/link'
import { useRouter } from '../components/router'

const searchParams = {
  test: parseAsInteger.withDefault(0)
}
const getLink = createSerializer(searchParams)

// --

type Repro1273StartPageProps = {
  otherPagePath: string
}

export function Repro1273StartPage({ otherPagePath }: Repro1273StartPageProps) {
  const router = useRouter()
  const Link = useLink()
  const href1 = getLink(otherPagePath, { test: 1 })
  const href2 = getLink(otherPagePath, { test: 2 })
  return (
    <>
      <button
        onClick={() => {
          router.push(href1, {})
        }}
      >
        Router 1
      </button>
      <button
        onClick={() => {
          router.push(href2, {})
        }}
      >
        Router 2
      </button>
      <Link href={href1}>Link 1</Link>
      <Link href={href2}>Link 2</Link>
    </>
  )
}

// Logs its committed value on every commit, so the test asserts on what the
// app actually consumes (the value read in effects / used for data fetching),
// ignoring render attempts React discards before paint. During a cacheComponents
// navigation back to this page, the cached subtree is briefly re-rendered
// against the outgoing route's params, but that render is never committed —
// logging in an effect (rather than in render) ignores it. Mirrors repro-1444.
export function Repro1273OtherPage() {
  const [{ test }] = useQueryStates(searchParams)
  useEffect(() => {
    console.log(`commit: ${test}`)
  })
  return <code>test: {test}</code>
}
