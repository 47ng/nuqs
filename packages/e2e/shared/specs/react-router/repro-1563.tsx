'use client'

import { debounce, useQueryState } from 'nuqs'

type Repro1563Props = {
  useNavigationType: () => string
}

export function Repro1563({ useNavigationType }: Repro1563Props) {
  const [state, setState] = useQueryState('test', {
    history: 'push',
    shallow: false
  })
  const [, setOther] = useQueryState('other', { shallow: false })
  const navigationType = useNavigationType()
  const pushThenReplace = () => {
    setState('pass')
    setOther('pass', { limitUrlUpdates: debounce(100) })
  }
  return (
    <>
      <button id="push" onClick={() => setState('pass')}>
        Push
      </button>
      <button id="push-then-replace" onClick={pushThenReplace}>
        Push then replace
      </button>
      <pre id="state">{state}</pre>
      <pre id="navigation-type">{navigationType}</pre>
    </>
  )
}
