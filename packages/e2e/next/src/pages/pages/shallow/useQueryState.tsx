import { Display } from 'e2e-shared/components/display'
import { ShallowUseQueryState } from 'e2e-shared/specs/shallow'
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'

type Props = {
  serverState: string | null
}

export default function Page({ serverState }: Props) {
  return (
    <>
      <ShallowUseQueryState />
      <Display environment="server" state={serverState} />
    </>
  )
}

export function getServerSideProps(
  ctx: GetServerSidePropsContext
): GetServerSidePropsResult<Props> {
  return {
    props: {
      serverState: (ctx.query.test ?? null) as string | null
    }
  }
}
