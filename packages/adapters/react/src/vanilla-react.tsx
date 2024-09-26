import { NuqsAdapter } from 'nuqs/adapters/react'
import App from './App'

export function VanillaReact() {
  return (
    <NuqsAdapter>
      <App router="Vite + React" />
    </NuqsAdapter>
  )
}
