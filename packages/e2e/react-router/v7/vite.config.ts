import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  build: {
    sourcemap: false, // Disable sourcemaps for e2e test apps
    rolldownOptions: {
      onwarn(warning, warn) {
        // Suppress sourcemap warnings from workspace dependencies
        if (warning.code === 'SOURCEMAP_ERROR') return
        warn(warning)
      }
    }
  }
})
