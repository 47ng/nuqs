'use client'

import {
  createSerializer,
  parseAsString,
  useQueryState,
  useQueryStates
} from 'nuqs'
import { Display } from '../components/display'
import { useLink } from '../components/link'
import { searchParams } from './flush-after-navigate.defs'

const getLink = createSerializer({
  test: parseAsString
})

export function FlushAfterNavigateStart({ path }: { path: string }) {
  const [{ debounce, throttle, linkState, linkPath }] =
    useQueryStates(searchParams)
  const Link = useLink()
  const [, preflush] = useQueryState('preflush')
  const [state, setState] = useQueryState('test', {
    limitUrlUpdates:
      debounce !== null
        ? { method: 'debounce', timeMs: debounce }
        : throttle !== null
          ? { method: 'throttle', timeMs: throttle }
          : undefined
  })
  return (
    <>
      <button id="test" onClick={() => setState('fail')}>
        Test
      </button>
      <button id="preflush" onClick={() => preflush(null)}>
        Preflush
      </button>
      <Link href={getLink(`${path}${linkPath}`, { test: linkState })}>
        Link
      </Link>
      <Display environment="client" state={state} />
    </>
  )
}

export function FlushAfterNavigateEnd() {
  const [state] = useQueryState('test')
  return <Display environment="client" state={state} />
}
