import { testRenderCount } from 'e2e-shared/specs/render-count.cy'

const hooks = ['useQueryState', 'useQueryStates'] as const
const shallows = [true, false] as const
const histories = ['replace', 'push'] as const

for (const hook of hooks) {
  for (const shallow of shallows) {
    for (const history of histories) {
      for (const startTransition of [false, true]) {
        testRenderCount({
          path: `/render-count/${hook}/${shallow}/${history}/${startTransition}/no-loader`,
          description: 'no loader',
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

for (const hook of hooks) {
  for (const shallow of shallows) {
    for (const history of histories) {
      for (const startTransition of [false, true]) {
        testRenderCount({
          path: `/render-count/${hook}/${shallow}/${history}/${startTransition}/sync-loader`,
          description: 'sync loader',
          hook,
          props: {
            shallow,
            history,
            startTransition
          },
          expected: {
            mount: 1,
            update: 2 + (shallow === false ? 1 : 0)
          }
        })
      }
    }
  }
}

for (const hook of hooks) {
  for (const shallow of shallows) {
    for (const history of histories) {
      for (const startTransition of [false, true]) {
        for (const delay of shallow === false ? [0, 50] : [0]) {
          testRenderCount({
            path: `/render-count/${hook}/${shallow}/${history}/${startTransition}/async-loader?delay=${delay}`,
            description: 'async loader',
            hook,
            props: {
              shallow,
              history,
              startTransition,
              delay
            },
            expected: {
              mount: 1,
              update: 2 + (shallow === false ? 1 : 0)
            }
          })
        }
      }
    }
  }
}
