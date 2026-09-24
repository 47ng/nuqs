import { createFileRoute } from '@tanstack/react-router'
import { useQueryState } from 'nuqs'

// https://github.com/47ng/nuqs/issues/1590
export const Route = createFileRoute('/repro-1590/$table')({
  validateSearch: (search: Record<string, unknown>) => ({
    limit: Number(search.limit ?? 50)
  }),
  component: Page
})

function Page() {
  const [view, setView] = useQueryState('view')
  return (
    <>
      <button onClick={() => setView('structure')}>Set view</button>
      <p id="state">{view}</p>
    </>
  )
}
