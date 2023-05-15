'use client'

import React from 'react'
import { queryTypes, useQueryState } from './../../../../../'

const IntegrationPage = () => {
  const [string, setString] = useQueryState('string')
  const [int, setInt] = useQueryState('int', queryTypes.integer)
  const [float, setFloat] = useQueryState('float', queryTypes.float)
  const [bool, setBool] = useQueryState('bool', queryTypes.boolean)
  return (
    <main>
      <h1>useQueryState</h1>
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
    </main>
  )
}

export default IntegrationPage
