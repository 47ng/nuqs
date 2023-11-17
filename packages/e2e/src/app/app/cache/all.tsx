import { cache } from './searchParams'

export function All() {
  const { bool, num, str, def, nope } = cache.all()
  return (
    <>
      <h2>From all:</h2>
      <p id="all-str">{str}</p>
      <p id="all-num">{num}</p>
      <p id="all-bool">{String(bool)}</p>
      <p id="all-def">{def}</p>
      <p id="all-nope">{String(nope)}</p>
    </>
  )
}
