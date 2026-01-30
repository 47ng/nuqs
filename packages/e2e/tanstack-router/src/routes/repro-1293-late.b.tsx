import { createFileRoute } from '@tanstack/react-router'
import { Repro1293PageB } from 'e2e-shared/specs/repro-1293'

const delayMs = 200
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const Route = createFileRoute('/repro-1293-late/b')({
  loader: async () => {
    await delay(delayMs)
    return null
  },
  component: Repro1293PageB
})
