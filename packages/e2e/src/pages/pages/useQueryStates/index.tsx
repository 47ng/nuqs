import Link from 'next/link'
import {
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  useQueryStates
} from 'nuqs'
import { HydrationMarker } from '../../../components/hydration-marker'

const IntegrationPage = () => {
  const [state, setState] = useQueryStates({
    string: parseAsString,
    int: parseAsInteger,
    float: parseAsFloat,
    bool: parseAsBoolean
  })
  return (
    <>
      <HydrationMarker />
      <button onClick={() => setState({ string: 'Hello' })}>Set string</button>
      <button onClick={() => setState({ int: 42 })}>Set int</button>
      <button onClick={() => setState({ float: 3.14159 })}>Set float</button>
      <button onClick={() => setState(old => ({ bool: !old.bool }))}>
        Toggle bool
      </button>
      <button
        id="clear-string"
        onClick={() => setState(() => ({ string: null }))}
      >
        Clear string
      </button>
      <button
        id="clear"
        onClick={() =>
          setState(() => ({
            string: null,
            int: null,
            float: null,
            bool: null
          }))
        }
      >
        Clear
      </button>
      <nav>
        <Link href="?string=Hello&int=42">Link A</Link>
        <Link href="?string=World&int=47">Link B</Link>
      </nav>
      <p id="json">{JSON.stringify(state)}</p>
      <p id="string">{state.string}</p>
      <p id="int">{state.int}</p>
      <p id="float">{state.float}</p>
      <p id="bool">
        {state.bool === null ? null : state.bool ? 'true' : 'false'}
      </p>
    </>
  )
}

export default IntegrationPage
