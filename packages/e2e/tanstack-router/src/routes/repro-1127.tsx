import { createFileRoute } from '@tanstack/react-router'
import { parseAsJson, useQueryState } from 'nuqs'

// https://github.com/47ng/nuqs/issues/1127

type Sort = { id: string; desc: boolean }

const parser = parseAsJson<Sort[]>(value => value as Sort[]).withDefault([])

export const Route = createFileRoute('/repro-1127')({
  component: Page
})

function Page() {
  const [sorting, setSorting] = useQueryState('sorting', parser)
  return (
    <>
      <button onClick={() => setSorting([{ id: 'name', desc: true }])}>
        Sort
      </button>
      <p id="state">{JSON.stringify(sorting)}</p>
    </>
  )
}
