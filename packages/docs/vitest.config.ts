import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // Mirror the `@/*` path alias from tsconfig so source modules under test can
    // be imported as-is. Vitest does not read tsconfig `paths` on its own.
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url))
    }
  },
  test: {
    // Scope to source tests only. Vitest's defaults don't exclude `.next/`, and
    // the registry generates `.ts` items — restricting the glob keeps the runner
    // off build output and codegen. `.tsx` is included so component tests can be
    // co-named with their `.tsx` source (e.g. pr-line, an async RSC rendered to
    // static markup).
    include: ['src/**/*.test.{ts,tsx}']
  }
})
