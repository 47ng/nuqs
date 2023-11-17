import { All } from './all'
import { Get } from './get'
import { cache } from './searchParams'

export default function Page({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const { str, bool, num, def, nope } = cache.parse(searchParams)
  return (
    <>
      <h2>From parse:</h2>
      <p id="parse-str">{str}</p>
      <p id="parse-num">{num}</p>
      <p id="parse-bool">{String(bool)}</p>
      <p id="parse-def">{def}</p>
      <p id="parse-nope">{String(nope)}</p>
      <All />
      <Get />
    </>
  )
}
