'use client'

import { Init } from '../Init'

// A large table / chart on a slow device: 80 rows taking 10ms each to render.
function Row({ index }: { index: number }) {
  const start = performance.now()
  while (performance.now() - start < 10) {}
  return <li>row {index}</li>
}

export default function Page() {
  return (
    <>
      <Init label="cpu" />
      <ul id="results">
        {Array.from({ length: 80 }, (_, i) => (
          <Row key={i} index={i} />
        ))}
      </ul>
    </>
  )
}
