import { parseAsInteger, useQueryState } from 'nuqs'

function Test({ id }: { id: number }) {
  console.log(`render test ${id}`)
  const [state, setState] = useQueryState(
    'test',
    parseAsInteger.withDefault(0).withOptions({ shallow: false })
  )
  return <button onClick={() => setState(c => c + 1)}>{state}</button>
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function loader() {
  await delay(500)
  return null
}

export default function Page() {
  console.log('page render')
  return (
    <>
      <Test id={1} />
      <Test id={2} />
      <Test id={3} />
      <Test id={4} />
    </>
  )
}
