import { Display } from 'e2e-shared/components/display'
import { ShallowUseQueryStates } from 'e2e-shared/specs/shallow'

export default function Page({ query }: { query: string }) {
  return (
    <>
      <ShallowUseQueryStates />
      <Display
        environment="server"
        state={new URLSearchParams(query).get('test')}
      />
    </>
  )
}

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
