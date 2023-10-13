'use client'

import { useQueryState } from 'next-usequerystate'
import Link from 'next/link'
import { counterParser, fromParser } from './parsers'

type RoutingTourViewProps = {
  thisPage: string
  nextPage: string
}

export const RoutingTourView: React.FC<RoutingTourViewProps> = ({
  thisPage,
  nextPage
}) => {
  const [counter] = useQueryState('counter', counterParser)
  const [from] = useQueryState('from', fromParser)
  return (
    <>
      <Link
        href={`/e2e/app/routing-tour/${nextPage}?from=${thisPage}&counter=${
          counter + 1
        }`}
      >
        Next
      </Link>
      <p>Came from: {from}</p>
      <p>This page: {thisPage}</p>
      <p>Next page: {nextPage}</p>
      <p>Counter: {counter}</p>
    </>
  )
}
