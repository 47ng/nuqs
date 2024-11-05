import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  // Vitest configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['vitest.setup.ts'],
    include: ['**/*.test.?(c|m)[jt]s?(x)'],
    env: {
      IS_REACT_ACT_ENVIRONMENT: 'true'
    }
  }
}))
