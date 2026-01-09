import type { TestConfig } from './define-test'
import { testBasicIO } from './specs/basic-io.spec'
import { testConditionalRendering } from './specs/conditional-rendering.spec'
import { testForm } from './specs/form.spec'
import { testHashPreservation } from './specs/hash-preservation.spec'
import { testJson } from './specs/json.spec'
import { testNativeArray } from './specs/native-array.spec'
import { testLifeAndDeath } from './specs/life-and-death.spec'
import { testLinking } from './specs/linking.spec'
import { testPrettyUrls } from './specs/pretty-urls.spec'
import { testReferentialStability } from './specs/referential-stability.spec'
import { testRouting } from './specs/routing.spec'
import { testScroll } from './specs/scroll.spec'

export function runSharedTests(
  pathPrefix: string = '',
  config: Partial<Omit<TestConfig, 'path' | 'hook'>> = {}
) {
  testBasicIO({
    path: `${pathPrefix}/basic-io/useQueryState`,
    hook: 'useQueryState',
    ...config
  })
  testBasicIO({
    path: `${pathPrefix}/basic-io/useQueryStates`,
    hook: 'useQueryStates',
    ...config
  })

  // --

  testJson({
    path: `${pathPrefix}/json`,
    ...config
  })

  // --

  testNativeArray({
    path: `${pathPrefix}/native-array`,
    ...config
  })

  // --

  testConditionalRendering({
    path: `${pathPrefix}/conditional-rendering/useQueryState`,
    hook: 'useQueryState',
    ...config
  })
  testConditionalRendering({
    path: `${pathPrefix}/conditional-rendering/useQueryStates`,
    hook: 'useQueryStates',
    ...config
  })

  // --

  // Form tests only apply to standard mode
  // (native HTML forms submit to location.search, not location.hash)
  if (!config.isHashRouter) {
    testForm({
      path: `${pathPrefix}/form/useQueryState`,
      hook: 'useQueryState',
      ...config
    })
    testForm({
      path: `${pathPrefix}/form/useQueryStates`,
      hook: 'useQueryStates',
      ...config
    })
  }

  // --

  // Hash preservation test only applies to standard mode
  // (can't have a hash within a hash in HashRouter)
  if (!config.isHashRouter) {
    testHashPreservation({
      path: `${pathPrefix}/hash-preservation`,
      ...config
    })
  }

  // --

  testLifeAndDeath({
    path: `${pathPrefix}/life-and-death`,
    ...config
  })

  // --

  testLinking({
    path: `${pathPrefix}/linking/useQueryState`,
    hook: 'useQueryState',
    ...config
  })
  testLinking({
    path: `${pathPrefix}/linking/useQueryStates`,
    hook: 'useQueryStates',
    ...config
  })

  // --

  testPrettyUrls({
    path: `${pathPrefix}/pretty-urls`,
    ...config
  })

  // --

  testReferentialStability({
    path: `${pathPrefix}/referential-stability/useQueryState`,
    hook: 'useQueryState',
    ...config
  })
  testReferentialStability({
    path: `${pathPrefix}/referential-stability/useQueryStates`,
    hook: 'useQueryStates',
    ...config
  })

  // --

  // HashRouter doesn't support shallow routing (no useNavigate in hash mode)
  // so only test with shallow: false
  const routingOptions = config.isHashRouter
    ? { shallowOptions: [false] as boolean[] }
    : {}
  testRouting({
    path: `${pathPrefix}/routing/useQueryState`,
    hook: 'useQueryState',
    ...routingOptions,
    ...config
  })
  testRouting({
    path: `${pathPrefix}/routing/useQueryStates`,
    hook: 'useQueryStates',
    ...routingOptions,
    ...config
  })

  // --

  testScroll({
    path: `${pathPrefix}/scroll`,
    ...config
  })
}
