import { testDebounce } from 'e2e-shared/specs/debounce.cy'

testDebounce({
  path: '/app/debounce',
  nextJsRouter: 'app'
})

// Note: disabled to let CI pass with latest versions of Next.js
// Hotfix will be removed by https://github.com/47ng/nuqs/pull/1269
// testDebounce({
//   path: '/pages/debounce',
//   nextJsRouter: 'pages'
// })
