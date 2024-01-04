'use client'

import { useQueryState } from 'nuqs'
import { parser } from './searchParams'

export function Client() {
  const [client, setClient] = useQueryState('client', parser)
  const [server, setServer] = useQueryState(
    'server',
    parser.withOptions({ shallow: false })
  )
  return (
    <>
      <p>
        Client: <span id="client">{client}</span>
      </p>
      <p>
        Server: <span id="server">{server}</span>
      </p>
      <button id="client-incr" onClick={() => setClient(c => c + 1)}>
        Client Incr
      </button>
      <button id="server-incr" onClick={() => setServer(c => c + 1)}>
        Server Incr
      </button>
    </>
  )
}
