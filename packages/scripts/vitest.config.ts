import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // The release scripts log progress on purpose; simulated failures in tests
    // would otherwise spam the runner. Keep logs visible for failing tests only.
    silent: 'passed-only'
  }
})
