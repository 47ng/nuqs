import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ autoCodeSplitting: true, target: 'react' }),
    viteReact({ compiler: process.env.REACT_COMPILER === 'true' })
  ],
  build: {
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3004
  }
})
