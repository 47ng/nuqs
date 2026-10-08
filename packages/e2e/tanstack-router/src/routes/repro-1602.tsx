import { createFileRoute } from '@tanstack/react-router'
import { useQueryState } from 'nuqs'

// https://github.com/47ng/nuqs/issues/1602
export const Route = createFileRoute('/repro-1602')({
  component: Page
})

function Page() {
  const [search, setSearch] = useQueryState('search')
  return (
    <>
      <button onClick={() => setSearch('test')}>Set search</button>
      <p id="state">{search}</p>
    </>
  )
}
