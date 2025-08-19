import { Display } from 'e2e-shared/components/display'
import { DisplaySegments, UrlControls } from 'e2e-shared/specs/dynamic-segments'
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { useRouter } from 'next/router'

type Props = {
  serverState: string | null
  serverSegments: string[]
}

export default function Page({ serverState, serverSegments }: Props) {
  const router = useRouter()
  return (
    <>
      <UrlControls>
        <Display environment="server" state={serverState} />
      </UrlControls>
      <DisplaySegments environment="server" segments={serverSegments} />
      <DisplaySegments
        environment="client"
        segments={[router.query.segment as string]}
      />
    </>
  )
}

export function getServerSideProps(
  ctx: GetServerSidePropsContext
): GetServerSidePropsResult<Props> {
  const serverState = (ctx.query.test as string) ?? null
  const serverSegments = [ctx.params?.segment as string]
  return {
    props: {
      serverState,
      serverSegments
    }
  }
}
