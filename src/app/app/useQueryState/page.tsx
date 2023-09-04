'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'
import { queryTypes, useQueryState } from '../../../../dist/app'

export default function IntegrationPage() {
  const [numPanes, setNumPanes] = React.useState(1)
  return (
    <main>
      <h1>useQueryState</h1>
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
  const [int, setInt] = useQueryState('int', queryTypes.integer)
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
  const [float, setFloat] = useQueryState('float', queryTypes.float)
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

const BoolSection = () => {
  const [bool, setBool] = useQueryState('bool', queryTypes.boolean)
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
    queryTypes.string.withDefault('Hello, world!')
  )
  return (
    <section>
      <h2>Text</h2>
      <input type="text" value={text} onChange={e => setText(e.target.value)} />
      <p>{text}</p>
    </section>
  )
}
