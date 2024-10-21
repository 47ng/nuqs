'use client'

import { useSearchParams } from 'next/navigation'
import { Querystring, QuerystringProps } from './querystring'

export function QuerySpy(props: Omit<QuerystringProps, 'value'>) {
  const searchParams = useSearchParams()
  return <Querystring value={searchParams} {...props} />
}
