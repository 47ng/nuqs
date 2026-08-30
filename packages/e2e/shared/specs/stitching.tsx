'use client'

import { useState } from 'react'
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

function useTestRunner() {
  const [error, setError] = useState('')
  const run = (test: () => Promise<unknown>) => {
    setError('')
    void test().catch(error => {
      setError(error instanceof Error ? error.message : String(error))
    })
  }
  return { error, run }
}

function StitchingUseQueryState() {
  const { error, run } = useTestRunner()
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
    new Promise<void>((resolve, reject) => {
      setC(x => x + 1, { limitUrlUpdates: debounce(500) })
      setTimeout(() => {
        setB(x => x + 1, { limitUrlUpdates: debounce(250) })
        setTimeout(() => {
          void setA(x => x + 1).then(() => resolve(), reject)
        }, 0)
      }, 0)
    })
  const testSequentially = async (test: () => Promise<unknown>) => {
    await test()
    await test()
  }

  return (
    <>
      <button id="same-tick" onClick={() => run(testOnSameTick)}>
        Test on same tick
      </button>
      <button id="staggered" onClick={() => run(testStaggered)}>
        Test staggered
      </button>
      <button
        id="same-tick-overlap"
        onClick={() => run(() => testSequentially(testOnSameTick))}
      >
        Test overlapping same-tick updates
      </button>
      <button
        id="staggered-overlap"
        onClick={() => run(() => testSequentially(testStaggered))}
      >
        Test overlapping staggered updates
      </button>
      <Display environment="client" state={[a, b, c].join(',')} />
      <output id="stitching-error">{error}</output>
    </>
  )
}

function StitchingUseQueryStates() {
  const { error, run } = useTestRunner()
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
    new Promise<void>((resolve, reject) => {
      setSearchParams(old => ({ c: old.c + 1 }), {
        limitUrlUpdates: debounce(500)
      })
      setTimeout(() => {
        setSearchParams(old => ({ b: old.b + 1 }), {
          limitUrlUpdates: debounce(250)
        })
        setTimeout(() => {
          void setSearchParams(old => ({ a: old.a + 1 })).then(
            () => resolve(),
            reject
          )
        }, 0)
      }, 0)
    })
  const testSequentially = async (test: () => Promise<unknown>) => {
    await test()
    await test()
  }

  return (
    <>
      <button id="same-tick" onClick={() => run(testOnSameTick)}>
        Test on same tick
      </button>
      <button id="staggered" onClick={() => run(testStaggered)}>
        Test staggered
      </button>
      <button
        id="same-tick-overlap"
        onClick={() => run(() => testSequentially(testOnSameTick))}
      >
        Test overlapping same-tick updates
      </button>
      <button
        id="staggered-overlap"
        onClick={() => run(() => testSequentially(testStaggered))}
      >
        Test overlapping staggered updates
      </button>
      <Display environment="client" state={[a, b, c].join(',')} />
      <output id="stitching-error">{error}</output>
    </>
  )
}
