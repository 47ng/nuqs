'use client'

import { debounce, parseAsInteger, useQueryState } from 'nuqs'
import { Display } from '../components/display'

const parser = parseAsInteger.withDefault(0)

export function Stitching() {
  const [a, setA] = useQueryState('a', parser)
  const [b, setB] = useQueryState('b', parser)
  const [c, setC] = useQueryState('c', parser)

  const test = () => {
    setA(x => x + 1)
    setB(x => x + 1, { limitUrlUpdates: debounce(100) })
    setC(x => x + 1, { limitUrlUpdates: debounce(200) })
  }

  return (
    <>
      <button onClick={test}>Test</button>
      <Display environment="client" target="a" state={a} />
      <Display environment="client" target="b" state={b} />
      <Display environment="client" target="c" state={c} />
    </>
  )
}
