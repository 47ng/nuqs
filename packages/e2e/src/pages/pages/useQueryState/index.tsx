import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { parseAsString, queryTypes, useQueryState } from 'nuqs'
import { HydrationMarker } from '../../../components/hydration-marker'

export const getServerSideProps = (async ctx => {
  const string = parseAsString.parseServerSide(ctx.query.string)
  console.dir({ string })
  return {
    props: {
      string
    }
  }
}) satisfies GetServerSideProps<{
  string: string | null
}>

const IntegrationPage = () => {
  const [string, setString] = useQueryState('string')
  const [int, setInt] = useQueryState('int', queryTypes.integer)
  const [float, setFloat] = useQueryState('float', queryTypes.float)
  const [bool, setBool] = useQueryState('bool', queryTypes.boolean)
  const [text, setText] = useQueryState(
    'text',
    queryTypes.string.withDefault('Hello, world!')
  )
  const pathname = usePathname()
  return (
    <main>
      <HydrationMarker />
      <h1>useQueryState</h1>
      <nav>
        Links&nbsp;
        <Link
          href={{
            pathname,
            query: {
              float: 0.42
            }
          }}
        >
          <button>0.42</button>
        </Link>
        <Link href="?float=0.47">
          <button>0.47</button>
        </Link>
      </nav>
      <section>
        <h2>String</h2>
        <button
          id="string_set_a"
          onClick={() => setString('a', { shallow: false })}
        >
          Set A
        </button>
        <button id="string_set_b" onClick={() => setString('b')}>
          Set B
        </button>
        <button id="string_clear" onClick={() => setString(null)}>
          Clear
        </button>
        <p id="string_value">{string}</p>
      </section>
      <section>
        <h2>Integer</h2>
        <button
          id="int_increment"
          onClick={() => setInt(old => (old ?? 0) + 1)}
        >
          Increment
        </button>
        <button
          id="int_decrement"
          onClick={() => setInt(old => (old ?? 0) - 1)}
        >
          Decrement
        </button>
        <button id="int_clear" onClick={() => setInt(null)}>
          Clear
        </button>
        <p id="int_value">{int}</p>
      </section>
      <section>
        <h2>Float</h2>
        <button
          id="float_increment"
          onClick={() => setFloat(old => (old ?? 0) + 0.1)}
        >
          Increment by 0.1
        </button>
        <button
          id="float_decrement"
          onClick={() => setFloat(old => (old ?? 0) - 0.1)}
        >
          Decrement by 0.1
        </button>
        <button id="float_clear" onClick={() => setFloat(null)}>
          Clear
        </button>
        <input
          type="range"
          value={float ?? 0}
          onChange={e => setFloat(e.target.valueAsNumber)}
          min={-1}
          max={1}
          step={0.0001}
        />
        <p id="float_value">{float}</p>
      </section>
      <section>
        <h2>Boolean</h2>
        <button id="bool_toggle" onClick={() => setBool(old => !old)}>
          Toggle
        </button>
        <button id="bool_clear" onClick={() => setBool(null)}>
          Clear
        </button>
        <p id="bool_value">{bool === null ? null : bool ? 'true' : 'false'}</p>
      </section>
      <section>
        <h2>Text</h2>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <p>{text}</p>
      </section>
    </main>
  )
}

export default IntegrationPage
