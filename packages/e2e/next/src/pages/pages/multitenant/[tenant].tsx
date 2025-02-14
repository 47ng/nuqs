import { ShallowUseQueryState } from 'e2e-shared/specs/shallow'
import { ShallowDisplay } from 'e2e-shared/specs/shallow-display'
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'

type Props = {
  serverState: string | null
  tenant: string | null
}

export default function Page({ serverState, tenant }: Props) {
  const params = useParams()
  const router = useRouter()
  return (
    <>
      <ShallowUseQueryState />
      <ShallowDisplay environment="server" state={serverState} />
      <p id="server-tenant">{tenant}</p>
      <p id="client-tenant">{params?.tenant}</p>
      <p id="router-pathname">{router.pathname}</p>
    </>
  )
}

export function getServerSideProps(
  ctx: GetServerSidePropsContext
): GetServerSidePropsResult<Props> {
  const tenant = ctx.params?.tenant as string | null

  if (!tenant) {
    return {
      notFound: true
    }
  }

  const serverState = (ctx.query.test as string) ?? null

  return {
    props: {
      serverState,
      tenant
    }
  }
}
