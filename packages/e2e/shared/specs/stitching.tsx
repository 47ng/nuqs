'use client'

import { debounce, parseAsInteger, useQueryState } from 'nuqs'
import { Display } from '../components/display'

const parser = parseAsInteger.withDefault(0)

export function Stitching() {
  const [a, setA] = useQueryState('a', parser)
  const [b, setB] = useQueryState('b', parser)
  const [c, setC] = useQueryState('c', parser)

  const testOnSameTick = () => {
    setA(x => x + 1)
    setB(x => x + 1, { limitUrlUpdates: debounce(100) })
    setC(x => x + 1, { limitUrlUpdates: debounce(200) })
  }
  const testStaggered = () => {
    setC(x => x + 1, { limitUrlUpdates: debounce(200) })
    setTimeout(() => {
      setB(x => x + 1, { limitUrlUpdates: debounce(100) })
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
      <Display environment="client" target="a" state={a} />
      <Display environment="client" target="b" state={b} />
      <Display environment="client" target="c" state={c} />
    </>
  )
}
