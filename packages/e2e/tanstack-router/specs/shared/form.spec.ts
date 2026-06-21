import { testForm } from 'e2e-shared/specs/form.spec.ts'

testForm({
  hook: 'useQueryState',
  path: '/form/useQueryState'
})

testForm({
  hook: 'useQueryStates',
  path: '/form/useQueryStates'
})
