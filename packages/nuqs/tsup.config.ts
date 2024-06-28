import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    server: 'src/index.server.ts'
  },
  format: ['esm'],
  dts: true,
  outDir: 'dist',
  splitting: true,
  treeshake: true
})
