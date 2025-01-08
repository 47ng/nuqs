import { testRenderCount } from 'e2e-shared/specs/render-count.cy'

const hooks = ['useQueryState', 'useQueryStates'] as const
const shallows = [true, false] as const
const histories = ['replace', 'push'] as const

for (const hook of hooks) {
  for (const shallow of shallows) {
    for (const history of histories) {
      for (const startTransition of [false, true]) {
        testRenderCount({
          path: `/render-count/${hook}/${shallow}/${history}/${startTransition}`,
          hook,
          props: {
            shallow,
            history,
            startTransition
          },
          expected: {
            mount: 1,
            update: 2
          }
        })
      }
    }
  }
}
