'use client'

import { createParser, parseAsInteger, useQueryState } from 'next-usequerystate'
import { z } from 'zod'

type DateRange = {
  from: Date
  to: Date
}

const parseAsDateRange = createParser({
  parse: (dateRangeString: string) => {
    if (!dateRangeString) return null

    if (typeof dateRangeString !== 'string') return null

    const [from, to] = dateRangeString.split(',')

    const dateRangeSchema = z.object({
      from: z.date(),
      to: z.date()
    })

    const validatedDateRange = dateRangeSchema.safeParse({
      from: new Date(from),
      to: new Date(to)
    })

    return validatedDateRange.success
      ? (validatedDateRange.data as DateRange)
      : null
  },
  serialize: dateRange => {
    if (!dateRange) return ''

    if (typeof dateRange !== 'object') return ''

    const { from, to } = dateRange

    if (!from) return ''

    return `${from?.toISOString()},${to?.toISOString()}`
  }
}).withOptions({ history: 'replace' })

export function Client() {
  const [dateParam, setDateParam] = useQueryState('date', parseAsDateRange)
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  return (
    <>
      <h1>Client</h1>
      <h3>Page: {page}</h3>
      <button onClick={() => setPage(page + 1)}>Next Page</button>
      <h3>Date Range: {JSON.stringify(dateParam)}</h3>
      <button
        onClick={() =>
          setDateParam({
            from: new Date(Date.now() - 1000 * 60 * 60 * 24),
            to: new Date()
          })
        }
      >
        Set Date Range
      </button>
    </>
  )
}
