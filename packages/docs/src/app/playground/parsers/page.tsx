'use client'

import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsHex,
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsJson,
  parseAsString,
  parseAsTimestamp,
  useQueryState
} from 'next-usequerystate'

export default function BasicCounterDemoPage() {
  const [str, setStr] = useQueryState('string', parseAsString.withDefault(''))
  const [int, setInt] = useQueryState('integer', parseAsInteger.withDefault(0))
  const [bool, setBool] = useQueryState(
    'boolean',
    parseAsBoolean.withDefault(false)
  )
  const [float, setFloat] = useQueryState('float', parseAsFloat.withDefault(0))
  const [iso, setIso] = useQueryState(
    'iso',
    parseAsIsoDateTime.withDefault(new Date(0))
  )
  const [ts, setTs] = useQueryState(
    'ts',
    parseAsTimestamp.withDefault(new Date(0))
  )
  const [hex, setHex] = useQueryState('hex', parseAsHex.withDefault(0))
  const [arr, setArr] = useQueryState(
    'array',
    parseAsArrayOf(parseAsIsoDateTime).withDefault([])
  )
  const [obj, setObj] = useQueryState('json', parseAsJson().withDefault({}))

  return (
    <>
      <h1>Parsers</h1>
      <ul>
        <li>
          String: <input value={str} onChange={e => setStr(e.target.value)} />{' '}
          {str}
        </li>
        <li>
          Integer:{' '}
          <input
            type="number"
            value={int}
            onChange={e =>
              setInt(
                Number.isNaN(e.target.valueAsNumber)
                  ? null
                  : e.target.valueAsNumber
              )
            }
          />{' '}
          {int}
        </li>
        <li>
          Boolean:{' '}
          <input
            type="checkbox"
            checked={bool}
            onChange={e => setBool(e.target.checked)}
          />{' '}
          {bool ? 'true' : 'false'}
        </li>
        <li>
          Float:{' '}
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={float}
            onChange={e =>
              setFloat(
                Number.isNaN(e.target.valueAsNumber)
                  ? null
                  : e.target.valueAsNumber
              )
            }
          />{' '}
          {float}
        </li>
        <li>
          ISO Date:{' '}
          <input
            type="datetime-local"
            value={iso.toISOString().slice(0, -1)}
            onChange={e => setIso(e.target.valueAsDate)}
          />{' '}
          {iso.toISOString()}
        </li>
        <li>
          Timestamp:{' '}
          <input
            type="datetime-local"
            value={ts.toISOString().slice(0, -1)}
            onChange={e => setTs(e.target.valueAsDate)}
          />{' '}
          {ts.toISOString()}
        </li>
        <li>
          Hex:{' '}
          <input
            type="number"
            value={hex}
            onChange={e => setHex(e.target.valueAsNumber)}
          />{' '}
          {hex}
        </li>
        <li>
          Array:{' '}
          <button onClick={() => setArr(vals => [...vals, new Date()])}>
            Push
          </button>
          <button onClick={() => setArr(null)}>Clear</button>
          <br />
          {arr.map((d, i) => (
            <div key={i}>{d.toISOString()}</div>
          ))}
        </li>
        <li>
          JSON: <button onClick={() => setObj({ foo: 'bar' })}>Set</button>
          <button onClick={() => setObj(null)}>Clear</button>
          <br />
          {JSON.stringify(obj)}
        </li>
      </ul>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/blob/next/packages/playground/src/app/demos/parsers/page.tsx">
          Source on GitHub
        </a>
      </p>
    </>
  )
}
