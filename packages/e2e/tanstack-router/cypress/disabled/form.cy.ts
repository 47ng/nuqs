import { testForm } from 'e2e-shared/specs/form.cy'

testForm({
  path: '/form/useQueryState',
  hook: 'useQueryState'
})

testForm({
  path: '/form/useQueryStates',
  hook: 'useQueryStates'
})
