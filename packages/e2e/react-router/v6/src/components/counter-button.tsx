import { parseAsInteger, useQueryState } from 'nuqs'

export function CounterButton() {
  const [count, setCount] = useQueryState(
    'count',
    parseAsInteger.withDefault(0).withOptions({ history: 'push' })
  )
  return <button onClick={() => setCount(c => c + 1)}>count is {count}</button>
}
