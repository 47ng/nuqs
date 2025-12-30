import react from '@vitejs/plugin-react'
import { defineConfig } from 'waku/config'

export default defineConfig({
  vite: {
    plugins: [
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler']
        }
      })
    ]
  }
})
