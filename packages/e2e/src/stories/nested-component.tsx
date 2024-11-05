import { searchParamsCache } from './search-params'

export const NestedComponent = () => {
  const all = searchParamsCache.all()
  return <pre>{JSON.stringify(all)}</pre>
}
