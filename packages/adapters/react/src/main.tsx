import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ReactRouter } from './react-router'
import { VanillaReact } from './vanilla-react'

createRoot(document.getElementById('root-vanilla')!).render(
  <StrictMode>
    <VanillaReact />
  </StrictMode>
)

createRoot(document.getElementById('root-react-router')!).render(
  <StrictMode>
    <ReactRouter />
  </StrictMode>
)
