import vinext from 'vinext'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vinext()],
  ssr: {
    // Force nuqs through Vite's transform pipeline so our next/* aliases work
    noExternal: ['nuqs']
  }
})
