import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/parsers.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  outDir: 'dist',
  splitting: true,
  treeshake: true
})
