'use client'

import Link from 'next/link'
import { useQueryState } from 'nuqs'
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
        href={`/app/routing-tour/${nextPage}?from=${thisPage}&counter=${
          counter + 1
        }`}
      >
        Next
      </Link>
      <p>
        Came from: <span id="from">{from}</span>
      </p>
      <p>
        This page: <span id="this">{thisPage}</span>
      </p>
      <p>
        Next page: <span id="next">{nextPage}</span>
      </p>
      <p>
        Counter: <span id="counter">{counter}</span>
      </p>
    </>
  )
}
