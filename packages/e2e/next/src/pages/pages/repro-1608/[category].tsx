import { useState } from 'react'
import { useRouter } from 'next/router'
import { parseAsInteger, useQueryStates } from 'nuqs'

export async function getServerSideProps() {
  return { props: {} }
}

export default function Repro1608() {
  const router = useRouter()
  const [{ count }, setQuery] = useQueryStates({
    count: parseAsInteger.withDefault(0)
  })
  const [report, setReport] = useState<{
    first: string | null
    second: string | null
    browserSearch: string
  } | null>(null)

  async function run(navigate: boolean) {
    const first = await setQuery({ count: 2 })
    const second = await setQuery({})
    setReport({
      first: first.get('count'),
      second: second.get('count'),
      browserSearch: location.search
    })
    if (navigate) {
      await router.replace(`/pages/repro-1608/blue?${second}`, undefined, {
        shallow: true
      })
    }
  }

  return (
    <main>
      <output data-testid="count">{count}</output>
      <button onClick={() => run(false)}>Update and read snapshot</button>
      <button onClick={() => run(true)}>Update and navigate</button>
      <pre data-testid="report">{JSON.stringify(report)}</pre>
    </main>
  )
}
