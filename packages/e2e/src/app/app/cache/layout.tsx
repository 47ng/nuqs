import React from 'react'
import { cache } from './searchParams'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { str, bool, num, def, nope } = cache.all()
  return (
    <>
      {children}
      <h2>Layout</h2>
      <p style={{ display: 'flex', gap: '1rem' }}>
        <span id="layout-str">{str}</span>
        <span id="layout-num">{num}</span>
        <span id="layout-bool">{String(bool)}</span>
        <span id="layout-def">{def}</span>
        <span id="layout-nope">{String(nope)}</span>
      </p>
    </>
  )
}
