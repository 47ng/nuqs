'use client'

import {
  parseAsString,
  useQueryState,
  useQueryStates
} from 'next-usequerystate'
import Link from 'next/link'

const parser = parseAsString.withDefault('')

export default function CrosslinkDemoPage() {
  const [foo1, setFoo1] = useQueryState('foo', parser)
  const [bar1, setBar1] = useQueryState('bar', parser)
  const [{ foo: foo2, bar: bar2 }, setAll] = useQueryStates({
    foo: parser,
    bar: parser
  })

  return (
    <>
      <h1>Crosslink</h1>
      <p>
        This demo shows how <code>useQueryState</code> and{' '}
        <code>useQueryStates</code> keys can overlap and stay in sync.
      </p>
      <button onClick={() => setFoo1('a')}>set foo via useQueryState</button>
      <button onClick={() => setAll({ foo: 'b' })}>
        set foo via useQueryStates
      </button>
      <button
        onClick={() => {
          setBar1('a')
          setAll({ foo: 'c' })
        }}
      >
        set bar via useQueryState and foo via useQueryStates
      </button>
      <button
        onClick={() => {
          setBar1(x => x.toUpperCase())
          setAll(x => ({ foo: x.foo.toUpperCase() }))
        }}
      >
        uppercase diff
      </button>
      <button
        onClick={() => {
          setFoo1(x => x + 'asdf')
          setAll(x => ({ foo: x.foo.toUpperCase() }))
        }}
      >
        foo should end with ASDF
      </button>
      <Link href="?foo=from-link&bar=from-link">Navigate</Link>
      <pre>
        <code>
          {`
[useQueryState]  foo: ${foo1}
[useQueryStates] foo: ${foo2}
[useQueryState]  bar: ${bar1}
[useQueryStates] bar: ${bar2}
`}
        </code>
      </pre>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/tree/next/packages/docs/src/app/(pages)/playground/crosslink/page.tsx">
          Source on GitHub
        </a>
      </p>
    </>
  )
}
