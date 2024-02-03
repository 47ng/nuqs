import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    parsers: 'src/index.parsers.ts',
    server: 'src/index.server.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  outDir: 'dist',
  splitting: true,
  treeshake: true
})
