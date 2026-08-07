'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { Activity, useEffect, useState } from 'react'
import { Display } from '../components/display'

// Logs its committed (painted) value on every commit, so a test can detect a
// stale value being shown for a frame when the surrounding <Activity> switches
// from hidden back to visible. Logging in an effect (rather than in render)
// only captures committed renders, ignoring render attempts React discards
// before paint (e.g. a setState-during-render reconciliation).
function Name() {
  const [name] = useQueryState('name', parseAsString)
  useEffect(() => {
    console.log(`commit: ${name ?? '<null>'}`)
  })
  return <Display environment="client" state={name} />
}

export function Repro1444() {
  const [visible, setVisible] = useState(true)
  const [name, setName] = useQueryState('name', parseAsString)
  return (
    <>
      <input
        aria-label="name"
        value={name ?? ''}
        onChange={e => setName(e.target.value || null)}
      />
      <button onClick={() => setVisible(v => !v)}>toggle visibility</button>
      <Activity mode={visible ? 'visible' : 'hidden'}>
        <Name />
      </Activity>
    </>
  )
}
