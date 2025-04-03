import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import fc, { VerbosityLevel } from 'fast-check'
import { afterEach, expect } from 'vitest'

expect.extend(matchers)

// https://testing-library.com/docs/react-testing-library/api/#cleanup
afterEach(cleanup)

fc.configureGlobal({
  numRuns: 1000,
  verbose: process.env.CI ? VerbosityLevel.None : VerbosityLevel.VeryVerbose,
  interruptAfterTimeLimit: 4000
})
