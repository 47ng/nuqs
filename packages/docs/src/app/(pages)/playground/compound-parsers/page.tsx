'use client'

import { parseAsArrayOf, parseAsJson, useQueryState } from 'next-usequerystate'

const escaped = '-_.!~*\'()?#/&,"`<>{}[]|•@$£%+=:;'

export default function CompoundParsersDemo() {
  const [code, setCode] = useQueryState(
    'code',
    parseAsJson<any>().withDefault({})
  )
  const [array, setArray] = useQueryState(
    'array',
    parseAsArrayOf(parseAsJson<any>(), ';').withDefault([])
  )
  return (
    <>
      <h1>Compound parsers</h1>
      <section>
        <h2>JSON</h2>
        <button onClick={() => setCode({})}>Set to {'{}'}</button>
        <button onClick={() => setCode([])}>Set to {'[]'}</button>
        <button onClick={() => setCode([1, 2, 3])}>Set to {'[1,2,3]'}</button>
        <button onClick={() => setCode({ hello: 'world' })}>
          Set to {'{hello:"world"}'}
        </button>
        <button onClick={() => setCode({ escaped })}>
          Set to escaped chars
        </button>
        <pre>
          <code>{JSON.stringify(code, null, 2)}</code>
        </pre>
      </section>
      <section>
        <h2>Arrays</h2>
        <button onClick={() => setArray(null)}>Clear</button>
        <button onClick={() => setArray(a => [...a, {}])}>Push {'{}'}</button>
        <button onClick={() => setArray(a => [...a, [1, 2, 3]])}>
          Push {'[1,2,3]'}
        </button>
        <button onClick={() => setArray(a => [...a, { hello: 'world' }])}>
          Push hello world
        </button>
        <button onClick={() => setArray(a => [...a, { escaped }])}>
          Push escaped chars
        </button>
        <pre>
          <code>{JSON.stringify(array, null, 2)}</code>
        </pre>
      </section>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/tree/next/packages/docs/src/app/(pages)/playground/compound-parsers/page.tsx">
          Source on GitHub
        </a>
      </p>
    </>
  )
}
