import { Display } from 'e2e-shared/components/display'
import { ShallowUseQueryState } from 'e2e-shared/specs/shallow'

export default function Page({ query }: { query: string }) {
  return (
    <>
      <ShallowUseQueryState />
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
