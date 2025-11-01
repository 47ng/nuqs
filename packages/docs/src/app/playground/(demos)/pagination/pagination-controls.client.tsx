'use client'

import {
  Pagination,
  PaginationButton,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious
} from '@/src/components/ui/pagination'
import { cn } from '@/src/lib/utils'
import React from 'react'
import { usePage } from './search-params'

type PaginationControlsProps = {
  numPages: number
}

// Use client-side hooks to update the page number
// and observe the loading state
export function ClientPaginationControls({
  numPages
}: PaginationControlsProps) {
  const [isLoading, startTransition] = React.useTransition()
  const [page, setPage] = usePage({ startTransition })
  return (
    <Pagination className="not-prose items-center gap-2">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          />
        </PaginationItem>
        {Array.from({ length: numPages }, (_, i) => (
          <PaginationItem key={i}>
            <PaginationButton
              isActive={page === i + 1}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </PaginationButton>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            disabled={page === numPages}
            onClick={() => setPage(p => Math.min(numPages, p + 1))}
          />
        </PaginationItem>
      </PaginationContent>
      <div
        aria-label={isLoading ? 'Loading' : 'Idle'}
        aria-live={isLoading ? 'polite' : undefined}
        className={cn(
          'h-2 w-2 rounded-full bg-green-500',
          isLoading && 'animate-pulse bg-amber-500'
        )}
      />
    </Pagination>
  )
}
