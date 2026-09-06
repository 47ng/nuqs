import { testQueueLifecycle } from 'e2e-shared/specs/queue-lifecycle.spec.ts'

testQueueLifecycle({ path: '/queue-lifecycle', router: 'waku' })
