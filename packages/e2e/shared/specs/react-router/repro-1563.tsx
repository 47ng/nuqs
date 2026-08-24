'use client'

import { debounce, useQueryState } from 'nuqs'

type Repro1563Props = {
  loaderCall: number
  useNavigation: () => { state: string }
  useNavigationType: () => string
}

export function Repro1563({
  loaderCall,
  useNavigation,
  useNavigationType
}: Repro1563Props) {
  const [state, setState] = useQueryState('test', {
    history: 'push',
    shallow: false
  })
  const [, setOther] = useQueryState('other', { shallow: false })
  const [shallow, setShallow] = useQueryState('shallow')
  const navigation = useNavigation()
  const navigationType = useNavigationType()
  const pushThenReplace = () => {
    setState('pass')
    setOther('pass', { limitUrlUpdates: debounce(100) })
  }
  const pushThenShallowReplace = () => {
    setState('pass')
    setShallow('pass', { limitUrlUpdates: debounce(100) })
  }

  return (
    <>
      <button id="push" onClick={() => setState('pass')}>
        Push
      </button>
      <button id="push-then-replace" onClick={pushThenReplace}>
        Push then replace
      </button>
      <button id="push-then-shallow-replace" onClick={pushThenShallowReplace}>
        Push then shallow replace
      </button>
      <button
        id="deep-replace"
        onClick={() => setState('pass', { history: 'replace' })}
      >
        Deep replace
      </button>
      <button
        id="shallow-replace"
        onClick={() =>
          setShallow('pass', {
            history: 'replace',
            shallow: true,
            limitUrlUpdates: debounce(100)
          })
        }
      >
        Shallow replace
      </button>
      <button
        id="shallow-push"
        onClick={() =>
          setShallow('pass', {
            history: 'push',
            shallow: true,
            limitUrlUpdates: debounce(100)
          })
        }
      >
        Shallow push
      </button>
      <pre id="state">{state}</pre>
      <pre id="shallow-state">{shallow}</pre>
      <pre id="loader-call">{loaderCall}</pre>
      <pre id="navigation-state">{navigation.state}</pre>
      <pre id="navigation-type">{navigationType}</pre>
    </>
  )
}
