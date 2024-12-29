import { parseAsString, useQueryState, useQueryStates } from 'nuqs'

type FormProps = {
  defaultValue: string
}

const testParser = parseAsString.withDefault('')

function Form({ defaultValue }: FormProps) {
  return (
    <form>
      <input type="text" id="test" name="test" defaultValue={defaultValue} />
      <button type="submit">Submit</button>
    </form>
  )
}

export function TestFormUseQueryState() {
  const [state] = useQueryState('test', testParser)
  return (
    <>
      <pre id="state">{state}</pre>
      <Form defaultValue={state} />
    </>
  )
}

export function TestFormUseQueryStates() {
  const [{ state }] = useQueryStates(
    {
      state: testParser
    },
    {
      urlKeys: {
        state: 'test'
      }
    }
  )
  return (
    <>
      <pre id="state">{state}</pre>
      <Form defaultValue={state} />
    </>
  )
}
