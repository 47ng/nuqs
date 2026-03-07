import { testPopstateQueueReset } from 'e2e-shared/specs/popstate-queue-reset.spec.ts'

testPopstateQueueReset({
  path: '/app/popstate-queue-reset',
  router: 'next-app'
})

testPopstateQueueReset({
  path: '/pages/popstate-queue-reset',
  router: 'next-pages'
})
