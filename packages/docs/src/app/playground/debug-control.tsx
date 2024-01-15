'use client'

import React from 'react'

export default function DebugControl() {
  const [checked, setChecked] = React.useState(() => {
    if (typeof localStorage === 'undefined') {
      return false
    }
    return localStorage.getItem('debug')?.includes('nuqs') ?? false
  })
  const update = React.useCallback(() => {
    setChecked(c => {
      const checked = !c
      if (typeof localStorage !== 'undefined') {
        if (checked) {
          localStorage.setItem('debug', 'nuqs')
        } else {
          localStorage.removeItem('debug')
        }
      }
      return checked
    })
  }, [])

  return (
    <label className="mr-auto space-x-2 text-zinc-500">
      <input type="checkbox" checked={checked} onChange={update} />
      <span className="select-none">Console debugging</span>
    </label>
  )
}
