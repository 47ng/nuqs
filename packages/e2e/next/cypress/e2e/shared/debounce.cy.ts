import { testDebounce } from 'e2e-shared/specs/debounce.cy'

testDebounce({
  path: '/app/debounce',
  nextJsRouter: 'app'
})

testDebounce({
  path: '/pages/debounce',
  nextJsRouter: 'pages'
})
