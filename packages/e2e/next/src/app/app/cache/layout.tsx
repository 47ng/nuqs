import React from 'react'
import { cache } from './searchParams'

export default function Layout({ children }: { children: React.ReactNode }) {
  let result = ''
  try {
    result = JSON.stringify(cache.all())
  } catch (error) {
    result = String(error)
  }
  return (
    <>
      {children}
      <h2>Layout</h2>
      <p id="layout-result">{result}</p>
    </>
  )
}
