import type { GetServerSideProps } from 'next'
import { Client } from '../../../app/app/push/client'
import { loadSearchParams } from '../../../app/app/push/searchParams'

export default function Page({ server }: { server: number }) {
  return (
    <>
      <p>
        Server side: <span id="server-side">{server}</span>
      </p>
      <Client />
    </>
  )
}

export const getServerSideProps = (async ctx => {
  console.dir({ _: 'gSSP', query: ctx.query }, { depth: null })
  const { server } = loadSearchParams(ctx.query)
  return {
    props: {
      server
    }
  }
}) satisfies GetServerSideProps<{
  server: number
}>
