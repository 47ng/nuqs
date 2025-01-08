export type TestConfig = {
  path: string
  hook?: 'useQueryState' | 'useQueryStates'
  nextJsRouter?: 'app' | 'pages'
  description?: string
}

export function createTest(
  firstArg: string | { label: string; variants: string },
  implementation: (config: TestConfig) => void
) {
  return (config: TestConfig) => {
    const label = typeof firstArg === 'string' ? firstArg : firstArg.label
    const variants = typeof firstArg === 'string' ? null : firstArg.variants
    const router = config.nextJsRouter ? `${config.nextJsRouter} router` : null
    const describeLabel = [
      label,
      router,
      config.hook,
      variants,
      config.description
    ]
      .filter(Boolean)
      .join(' - ')
    describe(describeLabel, implementation.bind(null, config))
  }
}
