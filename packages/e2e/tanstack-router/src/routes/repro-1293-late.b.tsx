import { createFileRoute } from '@tanstack/react-router'
import { Repro1293PageB } from 'e2e-shared/specs/repro-1293'

// A loader delay forces TanStack Router into its pending phase, keeping the
// outgoing page (A) mounted while `state.location` has already flipped to this
// route. That's the window where the source page reads the destination's
// search params. See https://github.com/47ng/nuqs/issues/1433
const delayMs = 200
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const Route = createFileRoute('/repro-1293-late/b')({
  loader: async () => {
    await delay(delayMs)
    return null
  },
  component: Repro1293PageB
})
