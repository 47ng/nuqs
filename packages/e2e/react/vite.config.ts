import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    build: {
      target: 'es2022',
      sourcemap: true
    },
    define: {
      'process.env.FULL_PAGE_NAV_ON_SHALLOW_FALSE': JSON.stringify(
        env.FULL_PAGE_NAV_ON_SHALLOW_FALSE
      )
    }
  }
})
