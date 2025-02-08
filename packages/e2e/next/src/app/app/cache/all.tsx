import { cache } from './searchParams'

export function All() {
  const { bool, num, str, def, nope, idx } = cache.all()
  return (
    <>
      <h2>From all:</h2>
      <p style={{ display: 'flex', gap: '1rem' }}>
        <span id="all-str">{str}</span>
        <span id="all-num">{num}</span>
        <span id="all-idx">{String(idx)}</span>
        <span id="all-bool">{String(bool)}</span>
        <span id="all-def">{def}</span>
        <span id="all-nope">{String(nope)}</span>
      </p>
    </>
  )
}
