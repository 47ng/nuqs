import { testDebounce } from 'e2e-shared/specs/debounce.spec.ts'

testDebounce({
  path: '/app/debounce',
  router: 'next-app'
})

testDebounce({
  path: '/pages/debounce',
  router: 'next-pages'
})
