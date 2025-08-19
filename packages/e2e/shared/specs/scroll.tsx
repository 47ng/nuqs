'use client'

import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'

export function Scroll() {
  return (
    <>
      <ScrollDetector />
      <div style={{ height: '200vh' }} />
      <ScrollAction />
    </>
  )
}

function ScrollDetector() {
  const [atTheTop, setAtTheTop] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    window.addEventListener('scroll', () => setAtTheTop(window.scrollY === 0), {
      signal: controller.signal
    })
    return () => controller.abort()
  }, [])

  return (
    <span
      id={atTheTop ? 'at-the-top' : 'not-at-the-top'}
      style={{ position: 'fixed', top: 8 }}
    >
      {atTheTop ? null : 'not '}at the top
    </span>
  )
}

function ScrollAction() {
  const [scroll] = useQueryState('scroll', parseAsBoolean.withDefault(false))
  const [, setState] = useQueryState('test', {
    scroll
  })

  useEffect(() => {
    document.getElementById('scroll-to-me')?.scrollIntoView()
  }, [])

  return (
    <button
      id="scroll-to-me"
      onClick={() => setState('pass')}
      style={{ marginInline: 'auto', display: 'block' }}
    >
      Test
    </button>
  )
}
