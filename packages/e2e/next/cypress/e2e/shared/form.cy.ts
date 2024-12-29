import { testForm } from 'e2e-shared/specs/form.cy'

testForm({
  path: '/app/form/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'app'
})

testForm({
  path: '/app/form/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'app'
})

testForm({
  path: '/pages/form/useQueryState',
  hook: 'useQueryState',
  nextJsRouter: 'pages'
})

testForm({
  path: '/pages/form/useQueryStates',
  hook: 'useQueryStates',
  nextJsRouter: 'pages'
})
