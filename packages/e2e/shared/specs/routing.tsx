'use client'

import {
  parseAsBoolean,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates
} from 'nuqs'
import { useRouter } from '../components/router'
import {
  getRoutingUrl,
  routingSearchParams,
  routingUrlKeys
} from './routing.defs'

type Props = {
  path: string
}

export function RoutingUseQueryState({ path }: Props) {
  const router = useRouter()
  const [state] = useQueryState('test')
  const [shallow] = useQueryState('shallow', parseAsBoolean.withDefault(true))
  const [method] = useQueryState(
    'router',
    parseAsStringLiteral(['push', 'replace']).withDefault('replace')
  )
  const test = () => {
    const url = getRoutingUrl(path, { state: 'pass' })
    const routerMethod = router[method].bind(router)
    routerMethod(url, { shallow })
  }
  return (
    <>
      <button onClick={test}>Test</button>
      <pre id="state">{state}</pre>
    </>
  )
}

export function RoutingUseQueryStates({ path }: Props) {
  const router = useRouter()
  const [{ state, shallow, method }] = useQueryStates(routingSearchParams, {
    urlKeys: routingUrlKeys
  })
  const test = () => {
    const url = getRoutingUrl(path, { state: 'pass' })
    const routerMethod = router[method].bind(router)
    routerMethod(url, { shallow })
  }
  return (
    <>
      <button onClick={test}>Test</button>
      <pre id="state">{state}</pre>
    </>
  )
}
