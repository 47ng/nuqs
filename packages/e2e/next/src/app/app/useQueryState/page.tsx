'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  parseAsBoolean,
  parseAsFloat,
  parseAsIndex,
  parseAsInteger,
  parseAsString,
  useQueryState
} from 'nuqs'
import React, { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <IntegrationPage />
    </Suspense>
  )
}

function IntegrationPage() {
  const [numPanes, setNumPanes] = React.useState(1)
  return (
    <main>
      <Link href="/">⬅️ Home</Link>
      <h1>useQueryState integration test</h1>
      <nav>
        <button onClick={() => setNumPanes(n => n + 1)}>+</button>
        <button onClick={() => setNumPanes(n => n - 1)}>-</button>
      </nav>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {Array.from({ length: numPanes }).map((_, i) => (
          <Pane key={i} />
        ))}
      </div>
    </main>
  )
}

const Pane = () => {
  const router = useRouter()
  return (
    <div>
      <nav>
        Links&nbsp;
        <Link href="?float=0.42" replace scroll={false}>
          <button>Link 0.42</button>
        </Link>
        <Link href="?float=0.47" replace scroll={false}>
          <button>Link 0.47</button>
        </Link>
        <button
          onClick={() => router.replace('?float=0.42', { scroll: false })}
        >
          Router 0.42
        </button>
        <button
          onClick={() => router.replace('?float=0.47', { scroll: false })}
        >
          Router 0.47
        </button>
      </nav>
      <StringSection />
      <IntSection />
      <FloatSection />
      <IndexSection />
      <BoolSection />
      <TextSection />
    </div>
  )
}

// --

const StringSection = () => {
  const [string, setString] = useQueryState('string')
  return (
    <section>
      <h2>String</h2>
      <button id="string_set_a" onClick={() => setString('a')}>
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
  )
}

const IntSection = () => {
  const [int, setInt] = useQueryState('int', parseAsInteger)
  return (
    <section>
      <h2>Integer</h2>
      <button id="int_decrement" onClick={() => setInt(old => (old ?? 0) - 1)}>
        -1
      </button>
      <button id="int_increment" onClick={() => setInt(old => (old ?? 0) + 1)}>
        +1
      </button>
      <button id="int_clear" onClick={() => setInt(null)}>
        Clear
      </button>
      <p id="int_value">{int}</p>
    </section>
  )
}

const FloatSection = () => {
  const [float, setFloat] = useQueryState('float', parseAsFloat)
  return (
    <section>
      <h2>Float</h2>
      <input
        style={{ display: 'block' }}
        type="range"
        value={float ?? 0}
        onChange={e => setFloat(e.target.valueAsNumber)}
        min={-1}
        max={1}
        step={0.0001}
      />
      <button
        id="float_decrement"
        onClick={() => setFloat(x => (x ?? 0) - 0.1)}
      >
        -0.1
      </button>
      <button
        id="float_increment"
        onClick={() => setFloat(x => (x ?? 0) + 0.1)}
      >
        +0.1
      </button>
      <button id="float_clear" onClick={() => setFloat(null)}>
        Clear
      </button>
      <p id="float_value">{float}</p>
    </section>
  )
}

const IndexSection = () => {
  const [index, setIndex] = useQueryState('index', parseAsIndex)
  return (
    <section>
      <h2>Index</h2>
      <button
        id="index_decrement"
        onClick={() => setIndex(old => (old ?? 0) - 1)}
      >
        -1
      </button>
      <button
        id="index_increment"
        onClick={() => setIndex(old => (old ?? 0) + 1)}
      >
        +1
      </button>
      <button id="index_clear" onClick={() => setIndex(null)}>
        Clear
      </button>
      <p id="index_value">{index}</p>
    </section>
  )
}

const BoolSection = () => {
  const [bool, setBool] = useQueryState('bool', parseAsBoolean)
  return (
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
  )
}

const TextSection = () => {
  const [text, setText] = useQueryState(
    'text',
    parseAsString.withDefault('Hello, world!')
  )
  return (
    <section>
      <h2>Text</h2>
      <input type="text" value={text} onChange={e => setText(e.target.value)} />
      <p>{text}</p>
    </section>
  )
}
