import { testRenderCount } from 'e2e-shared/specs/render-count.cy'

const hooks = ['useQueryState', 'useQueryStates'] as const
const shallows = [true, false] as const
const histories = ['replace', 'push'] as const

for (const hook of hooks) {
  for (const shallow of shallows) {
    for (const history of histories) {
      for (const startTransition of shallow === false
        ? [false, true]
        : [false]) {
        for (const delay of shallow === false ? [0, 50] : [0]) {
          testRenderCount({
            path: `/app/render-count/${hook}/${shallow}/${history}/${startTransition}?delay=${delay}`,
            hook,
            props: {
              shallow,
              history,
              startTransition,
              delay
            },
            expected: {
              mount: 1,
              update: shallow === false ? 3 : 2
            },
            nextJsRouter: 'app'
          })
        }
      }
    }
  }
}

for (const hook of hooks) {
  for (const shallow of shallows) {
    for (const history of histories) {
      for (const startTransition of shallow === false
        ? [false, true]
        : [false]) {
        for (const delay of shallow === false ? [0, 50] : [0]) {
          testRenderCount({
            path: `/pages/render-count/${hook}/${shallow}/${history}/${startTransition}?delay=${delay}`,
            hook,
            props: {
              shallow,
              history,
              startTransition,
              delay
            },
            expected: {
              mount: 1,
              update: 2
            },
            nextJsRouter: 'pages'
          })
        }
      }
    }
  }
}
