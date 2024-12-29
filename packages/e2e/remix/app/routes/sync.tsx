import { useQueryState, parseAsInteger } from 'nuqs'

function Test({ id }: { id: number }) {
  console.log(`render test ${id}`)
  const [state, setState] = useQueryState(
    'test',
    parseAsInteger
      .withDefault(0)
      .withOptions({ shallow: false })
  )
  return <button onClick={() => setState(c => c + 1)}>{state}</button>
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
