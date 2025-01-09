import { parseAsString, useQueryState, useQueryStates } from 'nuqs'

type TestComponentProps = {
  id: string
}

export function KeyIsolationUseQueryState() {
  return (
    <>
      <TestComponentUseQueryState id="a" />
      <TestComponentUseQueryState id="b" />
    </>
  )
}

export function KeyIsolationUseQueryStates() {
  return (
    <>
      <TestComponentUseQueryStates id="a" />
      <TestComponentUseQueryStates id="b" />
    </>
  )
}

function TestComponentUseQueryState({ id }: TestComponentProps) {
  const [state, setState] = useQueryState(id)
  console.log(`render ${id}`)
  return (
    <>
      <button id={`trigger-${id}`} onClick={() => setState('pass')}>
        Test {id}
      </button>
      <pre id={`state-${id}`}>{state}</pre>
    </>
  )
}

function TestComponentUseQueryStates({ id }: TestComponentProps) {
  const [state, setState] = useQueryStates({
    [id]: parseAsString
  })
  console.log(`render ${id}`)
  return (
    <>
      <button id={`trigger-${id}`} onClick={() => setState({ [id]: 'pass' })}>
        Test {id}
      </button>
      <pre id={`state-${id}`}>{state[id]}</pre>
    </>
  )
}
