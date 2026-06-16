import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Scope to source tests only. Vitest's defaults don't exclude `.next/`, and
    // the registry generates `.ts` items — restricting the glob keeps the runner
    // off build output and codegen.
    include: ['src/**/*.test.ts']
  }
})
