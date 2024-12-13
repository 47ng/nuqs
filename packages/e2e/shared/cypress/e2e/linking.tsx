'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useLink } from '../../components/link'

type Props = {
  path: string
}

export function LinkingUseQueryState({ path }: Props) {
  const Link = useLink()
  const [state] = useQueryState('test')
  return (
    <>
      <Link href={path + '?test=pass'}>Test</Link>
      <pre id="state">{state}</pre>
    </>
  )
}

export function LinkingUseQueryStates({ path }: Props) {
  const Link = useLink()
  const [{ test: state }] = useQueryStates({
    test: parseAsString
  })
  return (
    <>
      <Link href={path + '?test=pass'}>Test</Link>
      <pre id="state">{state}</pre>
    </>
  )
}
