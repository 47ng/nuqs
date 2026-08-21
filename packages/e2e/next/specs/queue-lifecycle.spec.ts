import { testQueueLifecycle } from 'e2e-shared/specs/queue-lifecycle.spec.ts'

testQueueLifecycle({ path: '/app/queue-lifecycle', router: 'next-app' })
testQueueLifecycle({ path: '/pages/queue-lifecycle', router: 'next-pages' })
