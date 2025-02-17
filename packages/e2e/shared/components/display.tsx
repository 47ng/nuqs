export type DisplayProps = {
  environment: 'client' | 'server'
  target?: string
  state: string | null
}

export function Display({
  state,
  environment,
  target = 'state'
}: DisplayProps) {
  return <pre id={`${environment}-${target}`}>{state}</pre>
}
