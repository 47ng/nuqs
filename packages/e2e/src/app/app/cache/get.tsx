import { cache } from './searchParams'

export function Get() {
  const bool = cache.get('bool')
  const num = cache.get('num')
  const str = cache.get('str')
  const def = cache.get('def')
  const nope = cache.get('nope')
  return (
    <>
      <h2>From get:</h2>
      <p id="get-str">{str}</p>
      <p id="get-num">{num}</p>
      <p id="get-bool">{String(bool)}</p>
      <p id="get-def">{def}</p>
      <p id="get-nope">{String(nope)}</p>
    </>
  )
}
