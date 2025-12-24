'use client'

import { debounce, useQueryState, useQueryStates } from 'nuqs'
import { Display } from '../components/display'
import { optionsSearchParams, searchParams } from './stitching.defs'

export function Stitching() {
  const [{ hook }] = useQueryStates(optionsSearchParams)
  if (hook === 'useQueryState') {
    return <StitchingUseQueryState />
  }
  if (hook === 'useQueryStates') {
    return <StitchingUseQueryStates />
  }
  return <>Invalid hook</>
}

function StitchingUseQueryState() {
  const [{ history, shallow }] = useQueryStates(optionsSearchParams)
  const [a, setA] = useQueryState(
    'a',
    searchParams.a.withOptions({ history, shallow })
  )
  const [b, setB] = useQueryState(
    'b',
    searchParams.b.withOptions({ history, shallow })
  )
  const [c, setC] = useQueryState(
    'c',
    searchParams.c.withOptions({ history, shallow })
  )

  const testOnSameTick = () => {
    setA(x => x + 1)
    setB(x => x + 1, { limitUrlUpdates: debounce(250) })
    setC(x => x + 1, { limitUrlUpdates: debounce(500) })
  }
  const testStaggered = () => {
    setC(x => x + 1, { limitUrlUpdates: debounce(500) })
    setTimeout(() => {
      setB(x => x + 1, { limitUrlUpdates: debounce(250) })
      setTimeout(() => {
        setA(x => x + 1)
      }, 0)
    }, 0)
  }

  return (
    <>
      <button id="same-tick" onClick={testOnSameTick}>
        Test on same tick
      </button>
      <button id="staggered" onClick={testStaggered}>
        Test staggered
      </button>
      <Display environment="client" state={[a, b, c].join(',')} />
    </>
  )
}

function StitchingUseQueryStates() {
  const [{ history, shallow }] = useQueryStates(optionsSearchParams)
  const [{ a, b, c }, setSearchParams] = useQueryStates(searchParams, {
    history,
    shallow
  })

  const testOnSameTick = () => {
    setSearchParams(old => ({ a: old.a + 1 }))
    setSearchParams(old => ({ b: old.b + 1 }), {
      limitUrlUpdates: debounce(250)
    })
    setSearchParams(old => ({ c: old.c + 1 }), {
      limitUrlUpdates: debounce(500)
    })
  }
  const testStaggered = () => {
    setSearchParams(old => ({ c: old.c + 1 }), {
      limitUrlUpdates: debounce(500)
    })
    setTimeout(() => {
      setSearchParams(old => ({ b: old.b + 1 }), {
        limitUrlUpdates: debounce(250)
      })
      setTimeout(() => {
        setSearchParams(old => ({ a: old.a + 1 }))
      }, 0)
    }, 0)
  }

  return (
    <>
      <button id="same-tick" onClick={testOnSameTick}>
        Test on same tick
      </button>
      <button id="staggered" onClick={testStaggered}>
        Test staggered
      </button>
      <Display environment="client" state={[a, b, c].join(',')} />
    </>
  )
}
