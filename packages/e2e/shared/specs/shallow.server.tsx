type ShallowDisplayProps = {
  environment: 'client' | 'server'
  state: string | null
}

export function ShallowDisplay({ state, environment }: ShallowDisplayProps) {
  return <pre id={environment + '-state'}>{state}</pre>
}
