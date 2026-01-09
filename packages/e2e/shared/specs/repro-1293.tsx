'use client'

import { parseAsInteger, useQueryState } from 'nuqs'
import { Display } from '../components/display'
import { useLink } from '../components/link'

type Props = {
  path: string
}

export function Repro1293PageA({ path }: Props) {
  const [count] = useQueryState('count', parseAsInteger.withDefault(0))
  const Link = useLink()

  return (
    <div>
      <Display environment="client" target="count" state={count} />
      <Display environment="client" target="expected" state={1} />
      <nav>
        <Link href={`${path.replace(/\/pageA$/, '')}/pageB?count=2`}>
          Go to Page B
        </Link>
      </nav>
    </div>
  )
}

export function Repro1293PageB({ path }: Props) {
  const [count] = useQueryState('count', parseAsInteger.withDefault(0))
  const Link = useLink()

  return (
    <div>
      <Display environment="client" target="count" state={count} />
      <Display environment="client" target="expected" state={2} />
      <nav>
        <Link href={`${path.replace(/\/pageB$/, '')}/pageA?count=1`}>
          Go to Page A
        </Link>
      </nav>
    </div>
  )
}
