'use client'

import React from 'react'

export default function DebugControl() {
  const [checked, setChecked] = React.useState(() => {
    if (typeof localStorage === 'undefined') {
      return false
    }
    return (
      localStorage.getItem('debug')?.includes('next-usequerystate') ?? false
    )
  })
  const update = React.useCallback(() => {
    setChecked(c => {
      const checked = !c
      if (typeof localStorage !== 'undefined') {
        if (checked) {
          localStorage.setItem('debug', 'next-usequerystate')
        } else {
          localStorage.removeItem('debug')
        }
      }
      return checked
    })
  }, [])

  return (
    <span>
      <input type="checkbox" checked={checked} onChange={update} />
      <label>Console debugging</label>
    </span>
  )
}
