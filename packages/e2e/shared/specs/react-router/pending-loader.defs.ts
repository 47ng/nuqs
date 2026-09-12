import { parseAsStringLiteral } from 'nuqs/server'

const history = parseAsStringLiteral(['push', 'replace'])

export const pendingLoaderOptions = {
  qHistory: history.withDefault('replace'),
  pageHistory: history.withDefault('replace'),
  panelHistory: history.withDefault('replace')
}

export function readLoaderRequest(request: Request) {
  const search = new URL(request.url).searchParams
  return {
    q: search.get('q'),
    page: search.get('page'),
    panel: search.get('panel')
  }
}

export type LoaderRequestData = ReturnType<typeof readLoaderRequest>

type ControlledRequest = {
  data: LoaderRequestData
  aborted: boolean
  release: () => void
}

declare global {
  interface Window {
    pendingLoaderControl?: {
      requests: ControlledRequest[]
      completed: number[]
    }
  }
}

export async function controlledLoader({ request }: { request: Request }) {
  const data = readLoaderRequest(request)
  if (data.q === 'init' && data.page === '1') {
    return data
  }
  const control = (window.pendingLoaderControl ??= {
    requests: [],
    completed: []
  })
  let release!: () => void
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  const entry = { data, aborted: request.signal.aborted, release }
  const id = control.requests.push(entry)
  const onAbort = () => {
    entry.aborted = true
  }
  request.signal.addEventListener('abort', onAbort, { once: true })
  try {
    // Keep running after abort so the router must discard the late result.
    await gate
    control.completed.push(id)
    return data
  } finally {
    request.signal.removeEventListener('abort', onAbort)
  }
}
