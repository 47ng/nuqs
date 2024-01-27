import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNextLink,
  PaginationPreviousLink
} from '@/src/components/ui/pagination'
import { cn } from '@/src/lib/utils'
import { searchParamsCache } from './searchParams'

type PaginationControlsProps = {
  numPages: number
}

// Use <Link> components to navigate between pages
export function ServerPaginationControls({
  numPages
}: PaginationControlsProps) {
  const { page, delay, renderOn } = searchParamsCache.all()
  function pageURL(page: number) {
    return `/playground/pagination?page=${page}&delay=${delay}&renderOn=${renderOn}`
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
