export type TestConfig = {
  path: string
  hook?: 'useQueryState' | 'useQueryStates'
  nextJsRouter?: 'app' | 'pages'
}

export function describeLabel(label: string, config: TestConfig) {
  const router = config.nextJsRouter ? ` (${config.nextJsRouter} router)` : ''
  return [config.hook, label, router].filter(Boolean).join(' - ')
}
