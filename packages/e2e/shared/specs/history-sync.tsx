'use client'

import { useState } from 'react'
import { Display } from '../components/display'

export function HistorySync() {
  const [state, setState] = useState('init')
  return (
    <>
      <button
        onClick={() => {
          history.replaceState(null, '', '?test=pass')
          setState(location.search || 'fail')
        }}
      >
        Test replaceState
      </button>
      <button
        onClick={() => {
          history.pushState(null, '', '?test=pass')
          setState(location.search || 'fail')
        }}
      >
        Test pushState
      </button>
      <Display environment="client" state={state} />
    </>
  )
}
