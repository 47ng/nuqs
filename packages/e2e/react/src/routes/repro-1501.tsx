import { LinkProvider, type LinkProps } from 'e2e-shared/components/link'
import { Repro1501 } from 'e2e-shared/specs/repro-1501'

import { useSyncExternalStore } from 'react'

const navigationEvent = 'repro-1501-navigation'

function Link({ href, onClick, ...props }: LinkProps) {
  return (
    <a
      href={href}
      onClick={event => {
        onClick?.(event)
        if (event.defaultPrevented) {
          return
        }
        event.preventDefault()
        history.pushState(history.state, '', href)
        window.dispatchEvent(new Event(navigationEvent))
      }}
      {...props}
    />
  )
}

function subscribe(callback: () => void) {
  window.addEventListener(navigationEvent, callback)
  return () => window.removeEventListener(navigationEvent, callback)
}

function getRouterValue() {
  return new URLSearchParams(location.search).get('folder')
}

function useRouterValue() {
  return useSyncExternalStore(subscribe, getRouterValue, () => null)
}

export default function Page() {
  return (
    <LinkProvider Link={Link}>
      <Repro1501 useRouterValue={useRouterValue} />
    </LinkProvider>
  )
}
