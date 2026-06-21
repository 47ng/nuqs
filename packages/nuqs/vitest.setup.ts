import fc, { VerbosityLevel } from 'fast-check'

fc.configureGlobal({
  numRuns: 1000,
  verbose: process.env.CI ? VerbosityLevel.None : VerbosityLevel.VeryVerbose,
  interruptAfterTimeLimit: 4000
})
