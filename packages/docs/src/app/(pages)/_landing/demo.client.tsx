'use client'

// [!code word:useQueryState]
import { parseAsInteger, useQueryState } from 'nuqs'

export function Demo() {
  const [hello, setHello] = useQueryState('hello', { defaultValue: '' })
  const [count, setCount] = useQueryState(
    'count',
    parseAsInteger.withDefault(0)
  )
  return (
    <>
      <button
        className="peer inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium tabular-nums text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        onClick={() => setCount(c => c + 1)}
        data-interacted={count > 0}
      >
        Count: {count}
      </button>
      <input
        value={hello}
        placeholder="Enter your name"
        className="peer flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        onChange={e => setHello(e.target.value || null)}
        data-interacted={Boolean(hello)}
      />
      <p className="sm:overflow-x-auto sm:text-ellipsis sm:text-nowrap">
        Hello, {hello || 'anonymous visitor'}!
      </p>
    </>
  )
}
