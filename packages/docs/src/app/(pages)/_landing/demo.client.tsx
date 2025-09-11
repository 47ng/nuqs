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
        className="peer bg-primary text-primary-foreground ring-offset-background hover:bg-primary/90 focus-visible:ring-ring inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
        onClick={() => setCount(c => c + 1)}
        data-interacted={count > 0}
      >
        Count: {count}
      </button>
      <input
        value={hello}
        placeholder="Enter your name"
        autoComplete="off"
        className="peer border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        onChange={e => setHello(e.target.value || null)}
        data-interacted={Boolean(hello)}
      />
      <p className="sm:overflow-x-auto sm:text-nowrap sm:text-ellipsis">
        Hello, {hello || 'anonymous visitor'}!
      </p>
    </>
  )
}
