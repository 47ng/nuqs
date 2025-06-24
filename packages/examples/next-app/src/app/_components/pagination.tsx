'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQueryStates } from 'nuqs'
import { searchParams, serialize } from '../searchParams'

export function Pagination({ total }: { total: number }) {
  const [{ page, limit }] = useQueryStates(searchParams)
  const totalPages = Math.ceil(total / limit)
  const currentSearchParams = useSearchParams()
  return (
    <nav className="mt-2 flex items-center gap-2 mx-auto">
      {Array.from({ length: totalPages }, (_, i) => {
        const p = i + 1
        const isActive = p === page
        return (
          <Link
            key={p}
            href={serialize(currentSearchParams, { page: p })}
            className={`rounded border px-3 py-1 text-sm transition-colors ${
              isActive
                ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-black'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {p}
          </Link>
        )
      })}
    </nav>
  )
}
