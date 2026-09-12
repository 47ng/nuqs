'use client'

// The shared fixture has no 'use client' directive (it is framework-agnostic);
// this local wrapper provides the client boundary for the app router.
export {
  KeyIsolationUseQueryState,
  KeyIsolationUseQueryStates
} from 'e2e-shared/specs/key-isolation'
