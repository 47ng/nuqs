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
    const flushed = setA(x => x + 1)
    setB(x => x + 1, { limitUrlUpdates: debounce(250) })
    setC(x => x + 1, { limitUrlUpdates: debounce(500) })
    return flushed
  }
  const testStaggered = () =>
    new Promise<void>(resolve => {
      setC(x => x + 1, { limitUrlUpdates: debounce(500) })
      setTimeout(() => {
        setB(x => x + 1, { limitUrlUpdates: debounce(250) })
        setTimeout(() => {
          void setA(x => x + 1).then(() => resolve())
        }, 0)
      }, 0)
    })
  const testOverlap = async (test: () => Promise<unknown>) => {
    await test()
    void test()
  }

  return (
    <>
      <button id="same-tick" onClick={testOnSameTick}>
        Test on same tick
      </button>
      <button id="staggered" onClick={testStaggered}>
        Test staggered
      </button>
      <button
        id="same-tick-overlap"
        onClick={() => testOverlap(testOnSameTick)}
      >
        Test overlapping same-tick updates
      </button>
      <button id="staggered-overlap" onClick={() => testOverlap(testStaggered)}>
        Test overlapping staggered updates
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
    const flushed = setSearchParams(old => ({ a: old.a + 1 }))
    setSearchParams(old => ({ b: old.b + 1 }), {
      limitUrlUpdates: debounce(250)
    })
    setSearchParams(old => ({ c: old.c + 1 }), {
      limitUrlUpdates: debounce(500)
    })
    return flushed
  }
  const testStaggered = () =>
    new Promise<void>(resolve => {
      setSearchParams(old => ({ c: old.c + 1 }), {
        limitUrlUpdates: debounce(500)
      })
      setTimeout(() => {
        setSearchParams(old => ({ b: old.b + 1 }), {
          limitUrlUpdates: debounce(250)
        })
        setTimeout(() => {
          void setSearchParams(old => ({ a: old.a + 1 })).then(() => resolve())
        }, 0)
      }, 0)
    })
  const testOverlap = async (test: () => Promise<unknown>) => {
    await test()
    void test()
  }

  return (
    <>
      <button id="same-tick" onClick={testOnSameTick}>
        Test on same tick
      </button>
      <button id="staggered" onClick={testStaggered}>
        Test staggered
      </button>
      <button
        id="same-tick-overlap"
        onClick={() => testOverlap(testOnSameTick)}
      >
        Test overlapping same-tick updates
      </button>
      <button id="staggered-overlap" onClick={() => testOverlap(testStaggered)}>
        Test overlapping staggered updates
      </button>
      <Display environment="client" state={[a, b, c].join(',')} />
    </>
  )
}
