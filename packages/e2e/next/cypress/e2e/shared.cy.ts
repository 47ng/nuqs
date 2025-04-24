import { runSharedTests } from 'e2e-shared/shared.cy'

runSharedTests('/app', { nextJsRouter: 'app' })
runSharedTests('/pages', { nextJsRouter: 'pages' })
