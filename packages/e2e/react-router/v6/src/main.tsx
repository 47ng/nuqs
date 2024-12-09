import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ReactRouter } from './react-router'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactRouter />
  </StrictMode>
)
