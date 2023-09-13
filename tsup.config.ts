import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/lib/index.ts', 'src/lib/parsers.ts'],
  splitting: true,
  define: {
    __DEBUG__: process.env.NODE_ENV === 'production' ? 'false' : 'true'
  }
})
