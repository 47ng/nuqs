'use client'

import { useQueryStates } from 'nuqs'
import { searchParams } from '../searchParams'

export function Filter() {
  const [filter, setFilter] = useQueryStates(searchParams, {
    shallow: false
  })
  return (
    <div className="flex flex-col gap-4">
      <input
        className="border border-gray-300 dark:border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        type="text"
        value={filter.search}
        onChange={e => setFilter({ search: e.target.value, page: 1 })}
        placeholder="Search users"
      />

      <div className="flex gap-2">
        <button
          onClick={() =>
            setFilter(prev => ({
              order: prev.order === 'asc' ? 'desc' : 'asc',
              page: 1
            }))
          }
          className="rounded px-4 flex-1 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 transition-colors"
        >
          Order:{' '}
          {filter.order === 'asc'
            ? 'Ascending'
            : filter.order === 'desc'
              ? 'Descending'
              : 'None'}
        </button>

        <button
          onClick={() => setFilter(null)}
          className="rounded px-4 py-2 text-sm border border-red-400 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-800 dark:text-red-100 dark:hover:bg-red-700 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
