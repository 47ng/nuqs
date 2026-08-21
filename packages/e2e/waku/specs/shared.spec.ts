import { runSharedTests } from 'e2e-shared/shared.spec.ts'

runSharedTests('', { router: 'waku', description: 'static' })
runSharedTests('/dynamic', { router: 'waku', description: 'dynamic' })
