import { testLoader } from 'e2e-shared/specs/loader.cy'

testLoader({ path: '/app/loader', nextJsRouter: 'app' })

testLoader({ path: '/pages/loader', nextJsRouter: 'pages' })
