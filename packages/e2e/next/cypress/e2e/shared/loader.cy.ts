import { testLoader } from 'e2e-shared/specs/loader.cy'

// In page components:

testLoader({ path: '/app/loader', nextJsRouter: 'app' })

testLoader({ path: '/pages/loader', nextJsRouter: 'pages' })

// In API routes:

testLoader({ path: '/api/app/loader', nextJsRouter: 'app' })

testLoader({ path: '/api/pages/loader', nextJsRouter: 'pages' })
