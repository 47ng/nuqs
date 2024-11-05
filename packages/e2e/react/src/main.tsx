import { NuqsAdapter } from 'nuqs/adapters/next'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CounterButton } from './components/counter-button'
import { SearchInput } from './components/search-input'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NuqsAdapter>
      <CounterButton />
      <SearchInput />
    </NuqsAdapter>
  </StrictMode>
)
