'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { useLink } from '../components/link'

type Props = {
  otherPageHref: string
}

export function Repro1358RouteA({ otherPageHref }: Props) {
  const [filter] = useQueryState('filter', parseAsString.withDefault('AAA'))
  const [mode, setMode] = useQueryState('mode', parseAsString)
  const Link = useLink()

  if (!mode) {
    setMode('default')
  }

  return (
    <>
      <pre id="route-label">Route A</pre>
      <pre id="filter">{filter}</pre>
      <pre id="mode">{mode}</pre>
      <Link href={otherPageHref}>Go to Route B</Link>
    </>
  )
}

export function Repro1358RouteB({ otherPageHref }: Props) {
  const [filter] = useQueryState('filter', parseAsString.withDefault('BBB'))
  const [mode, setMode] = useQueryState('mode', parseAsString)
  const Link = useLink()

  if (!mode) {
    setMode('default')
  }

  return (
    <>
      <pre id="route-label">Route B</pre>
      <pre id="filter">{filter}</pre>
      <pre id="mode">{mode}</pre>
      <Link href={otherPageHref}>Go to Route A</Link>
    </>
  )
}
