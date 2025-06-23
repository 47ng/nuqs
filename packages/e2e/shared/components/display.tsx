import type { ReactNode } from 'react'

export type DisplayProps = {
  environment: 'client' | 'server'
  target?: string
  state: ReactNode
}

export function Display({
  state,
  environment,
  target = 'state'
}: DisplayProps) {
  return <pre id={`${environment}-${target}`}>{state}</pre>
}
