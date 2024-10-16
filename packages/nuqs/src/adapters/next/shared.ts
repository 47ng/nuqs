import { renderQueryString } from '../../url-encoding'

export function renderURL(base: string, search: URLSearchParams) {
  const hashlessBase = base.split('#')[0] ?? ''
  const query = renderQueryString(search)
  const hash = location.hash
  return hashlessBase + query + hash
}
