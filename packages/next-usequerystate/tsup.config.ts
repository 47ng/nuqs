import { defineConfig } from 'tsup'

const isDebugBuild = process.env.NODE_ENV !== 'production'

export default defineConfig({
  entry: isDebugBuild ? ['src/index.ts'] : ['src/index.ts', 'src/parsers.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  outDir: isDebugBuild ? 'dist/debug' : 'dist',
  splitting: true,
  treeshake: true,
  sourcemap: isDebugBuild ? 'inline' : false,
  define: {
    __DEBUG__: isDebugBuild ? 'true' : 'false'
  }
})
