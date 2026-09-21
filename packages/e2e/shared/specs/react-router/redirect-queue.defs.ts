import { parseAsStringLiteral } from 'nuqs/server'

export const panelDebounceMs = 1000
export const redirectQueueOptions = {
  qHistory: parseAsStringLiteral(['push', 'replace']).withDefault('replace')
}

export function readRedirectQueueRequest(request: Request) {
  const search = new URL(request.url).searchParams
  return { q: search.get('q'), panel: search.get('panel') }
}

export type RedirectQueueData = ReturnType<typeof readRedirectQueueRequest>

declare global {
  interface Window {
    redirectQueueControl?: {
      requests: RedirectQueueData[]
      release: () => void
    }
  }
}

export async function redirectQueueLoader({ request }: { request: Request }) {
  const data = readRedirectQueueRequest(request)
  const control = (window.redirectQueueControl ??= {
    requests: [],
    release: () => {}
  })
  control.requests.push(data)
  if (data.q !== 'tea') {
    return data
  }
  await new Promise<void>(resolve => {
    control.release = resolve
  })
  if (new URL(request.url).searchParams.get('redirect') === 'true') {
    return new Response(null, {
      status: 302,
      headers: { Location: '?q=redirected&panel=server' }
    })
  }
  return data
}
