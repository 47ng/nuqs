import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    parsers: 'src/index.parsers.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  outDir: 'dist',
  splitting: true,
  treeshake: true
})
