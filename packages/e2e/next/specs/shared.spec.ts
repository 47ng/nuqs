import { runSharedTests } from 'e2e-shared/shared.spec.ts'

runSharedTests('/app', { router: 'next-app' })
runSharedTests('/pages', { router: 'next-pages' })
