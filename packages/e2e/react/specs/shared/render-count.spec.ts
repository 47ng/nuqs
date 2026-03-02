import { testRenderCount } from 'e2e-shared/specs/render-count.spec.ts'

const hooks = ['useQueryState', 'useQueryStates'] as const
const shallows = [true, false] as const
const histories = ['replace', 'push'] as const

// FPN makes render count checking unreliable
if (process.env.FULL_PAGE_NAV_ON_SHALLOW_FALSE !== 'true') {
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
}
