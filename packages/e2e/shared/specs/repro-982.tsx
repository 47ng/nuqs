'use client'

import { useQueryState } from 'nuqs'
import { Display } from '../components/display'

export function Repro982() {
  const [test] = useQueryState('test')
  const [, setOther] = useQueryState('other')
  return (
    <>
      <button onClick={() => setOther('x')}>Test</button>
      <Display environment="client" state={test} />
    </>
  )
}
