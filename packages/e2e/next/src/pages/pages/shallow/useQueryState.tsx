import { ShallowUseQueryState } from 'e2e-shared/specs/shallow'
import { ShallowDisplay } from 'e2e-shared/specs/shallow.server'
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'

type Props = {
  serverState: string | null
}

export default function Page({ serverState }: Props) {
  return (
    <>
      <ShallowUseQueryState />
      <ShallowDisplay environment="server" state={serverState} />
    </>
  )
}

export function getServerSideProps(
  ctx: GetServerSidePropsContext
): GetServerSidePropsResult<Props> {
  return {
    props: {
      serverState: ctx.query.test as string | null
    }
  }
}
