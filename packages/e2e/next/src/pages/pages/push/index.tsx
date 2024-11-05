import { GetServerSideProps } from 'next'
import { Client } from '../../../app/app/push/client'
import { parser } from '../../../app/app/push/searchParams'

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
  const server = parser.parseServerSide(ctx.query.server)
  return {
    props: {
      server
    }
  }
}) satisfies GetServerSideProps<{
  server: number
}>
