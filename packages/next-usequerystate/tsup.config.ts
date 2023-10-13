import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/parsers.ts'],
  splitting: true,
  dts: true,
  define: {
    __DEBUG__: process.env.NODE_ENV === 'production' ? 'false' : 'true'
  }
})
