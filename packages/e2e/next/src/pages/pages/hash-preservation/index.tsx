import { withHydrationMarker } from '@/components/hydration-marker'
import { HashPreservation } from 'e2e-shared/cypress/e2e/hash-preservation'

export default withHydrationMarker(HashPreservation)
