import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNextLink,
  PaginationPreviousLink
} from '@/src/components/ui/pagination'
import { cn } from '@/src/lib/utils'
import { getPaginatedLink, PaginationSearchParams } from './search-params'

type PaginationControlsProps = {
  numPages: number
  pagination: Promise<PaginationSearchParams>
}

// Use <Link> components to navigate between pages
export async function ServerPaginationControls({
  numPages,
  pagination
}: PaginationControlsProps) {
  const { page, delay, renderOn } = await pagination
  function pageURL(page: number) {
    return getPaginatedLink('/playground/pagination', {
      page,
      delay,
      renderOn
    })
  }
  return (
    <Pagination className="not-prose items-center gap-2">
      <PaginationContent>
        <PaginationItem>
          <PaginationPreviousLink
            href={pageURL(page - 1)}
            disabled={page === 1}
            scroll={false}
          />
        </PaginationItem>
        {Array.from({ length: numPages }, (_, i) => (
          <PaginationItem key={i}>
            <PaginationLink
              href={pageURL(i + 1)}
              isActive={page === i + 1}
              scroll={false}
            >
              {i + 1}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNextLink
            disabled={page === numPages}
            href={pageURL(page + 1)}
            scroll={false}
          />
        </PaginationItem>
      </PaginationContent>
      <div
        aria-label={'Loading status unavailable on the server'}
        className={cn('h-2 w-2 rounded-full bg-zinc-500')}
      />
    </Pagination>
  )
}
