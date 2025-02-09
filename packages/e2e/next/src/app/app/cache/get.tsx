import { cache } from './searchParams'

export function Get() {
  const bool = cache.get('bool')
  const num = cache.get('num')
  const idx = cache.get('idx')
  const str = cache.get('str')
  const def = cache.get('def')
  const nope = cache.get('nope')
  return (
    <>
      <h2>From get:</h2>
      <p style={{ display: 'flex', gap: '1rem' }}>
        <span id="get-str">{str}</span>
        <span id="get-num">{num}</span>
        <span id="get-idx">{String(idx)}</span>
        <span id="get-bool">{String(bool)}</span>
        <span id="get-def">{def}</span>
        <span id="get-nope">{String(nope)}</span>
      </p>
    </>
  )
}
