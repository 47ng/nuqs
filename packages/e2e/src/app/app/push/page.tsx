import { Client } from './client'
import { parser } from './searchParams'

export default function Page({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const server = parser.parseServerSide(searchParams.server)
  return (
    <>
      <p>
        Server side: <span id="server-side">{server}</span>
      </p>
      <Client />
    </>
  )
}
