export type TestConfig = {
  path: string
  hook?: 'useQueryState' | 'useQueryStates'
  nextJsRouter?: 'app' | 'pages'
  description?: string
}

export function createTest(
  label: string,
  implementation: (config: TestConfig) => void
) {
  return (config: TestConfig) => {
    const router = config.nextJsRouter ? `${config.nextJsRouter} router` : null
    const describeLabel = [label, config.hook, router, config.description]
      .filter(Boolean)
      .join(' - ')
    describe(describeLabel, implementation.bind(null, config))
  }
}
