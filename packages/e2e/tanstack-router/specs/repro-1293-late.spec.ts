// Pending-phase variant of repro-1293, reproducing
// https://github.com/47ng/nuqs/issues/1433
// Route B has a delayed loader, so TanStack Router keeps the outgoing page
// mounted during the pending phase while `state.location` already points to
// the destination — the outgoing page then reads the destination's params.
import { testRepro1293 } from 'e2e-shared/specs/repro-1293.spec.ts'

testRepro1293({
  path: '/repro-1293-late',
  router: 'tanstack-router',
  description: 'delayed loader'
})
