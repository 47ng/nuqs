import { Display } from '../components/display'
import type { DemoSearchParams } from './debounce.defs'

type DebounceServerDisplayProps = {
  state: DemoSearchParams
  children: React.ReactNode
}

export function DebounceServer({
  state,
  children
}: DebounceServerDisplayProps) {
  return (
    <>
      <h2>Server</h2>
      <Display environment="server" state={JSON.stringify(state)} />
      <h2>Client</h2>
      {children}
    </>
  )
}
