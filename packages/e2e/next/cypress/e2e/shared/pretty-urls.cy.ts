import { testPrettyUrls } from 'e2e-shared/specs/pretty-urls.cy'

testPrettyUrls({
  path: '/app/pretty-urls',
  nextJsRouter: 'app'
})

testPrettyUrls({
  path: '/pages/pretty-urls',
  nextJsRouter: 'pages'
})
