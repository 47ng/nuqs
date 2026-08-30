import { reactRouter } from '@react-router/dev/vite'
import { defineConfig } from 'vite'
import babel from 'vite-plugin-babel'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    ...(process.env.REACT_COMPILER === 'true'
      ? [
          babel({
            include: [
              /\/app\/.*\.[jt]sx?$/,
              /\/packages\/e2e\/shared\/specs\/.*\.tsx$/
            ],
            babelConfig: {
              presets: ['@babel/preset-typescript'],
              plugins: ['babel-plugin-react-compiler']
            }
          })
        ]
      : [])
  ],
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
