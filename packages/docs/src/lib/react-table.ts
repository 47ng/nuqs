import { Table } from '@tanstack/react-table'

const range = (start: number, end: number) => {
  const length = end - start + 1
  return Array.from({ length }, (_, index) => index + start)
}

export const ELLIPSIS = 'ellipsis' as const

export const getTablePaginationRange = <TData>(
  table: Table<TData>,
  /**
   * Siblings amount on left/right side of selected page, defaults to 1.
   */
  siblings = 1,
  /**
   * Amount of elements visible on left/right edges, defaults to 1.
   */
  boundaries = 1
) => {
  const total = table.getPageCount()
  const activePage = table.getState().pagination.pageIndex + 1

  const totalPageNumbers = siblings * 2 + 3 + boundaries * 2
  if (totalPageNumbers >= total) {
    return range(1, total)
  }

  const leftSiblingIndex = Math.max(activePage - siblings, boundaries)
  const rightSiblingIndex = Math.min(activePage + siblings, total - boundaries)

  const shouldShowLeftDots = leftSiblingIndex > boundaries + 2
  const shouldShowRightDots = rightSiblingIndex < total - (boundaries + 1)

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = siblings * 2 + boundaries + 2
    return [
      ...range(1, leftItemCount),
      ELLIPSIS,
      ...range(total - (boundaries - 1), total)
    ] as const
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = boundaries + 1 + 2 * siblings
    return [
      ...range(1, boundaries),
      ELLIPSIS,
      ...range(total - rightItemCount, total)
    ] as const
  }

  return [
    ...range(1, boundaries),
    ELLIPSIS,
    ...range(leftSiblingIndex, rightSiblingIndex),
    ELLIPSIS,
    ...range(total - boundaries + 1, total)
  ] as const
}
