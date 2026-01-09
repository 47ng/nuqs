import { runSharedTests } from 'e2e-shared/shared.spec.ts'

runSharedTests('', {
  router: 'react-router-v6-hash',
  isHashRouter: true
})
