// https://github.com/47ng/nuqs/issues/907

'use client'

import { parseAsString, useQueryStates } from 'nuqs'
import { useState } from 'react'

export default function Home() {
  const [nuqsConfig, setNuqsConfig] = useState<
    Record<string, typeof parseAsString>
  >({
    p1: parseAsString,
    p2: parseAsString
  })

  const [values] = useQueryStates(nuqsConfig)

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setNuqsConfig({ p1: parseAsString })}
          className="border p-2"
        >
          Update config (remove one of the keys)
        </button>

        <button
          onClick={() =>
            setNuqsConfig({
              p1: parseAsString,
              p2: parseAsString,
              p3: parseAsString
            })
          }
          className="border p-2"
        >
          Update config (add a new key)
        </button>

        <button
          onClick={() =>
            setNuqsConfig({
              p1: parseAsString,
              p5: parseAsString
            })
          }
          className="border p-2"
        >
          Update config (replace a key)
        </button>
      </div>
      <div>Config keys: {JSON.stringify(Object.keys(nuqsConfig))}</div>
      <div>Result: {JSON.stringify(values)}</div>
    </>
  )
}
