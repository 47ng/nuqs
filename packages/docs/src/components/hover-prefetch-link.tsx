'use client'

import NextLink from 'next/link'
import { useState, type ComponentProps } from 'react'

type HoverPrefetchLinkProps = ComponentProps<'a'> & {
  prefetch?: boolean
}

export function HoverPrefetchLink({
  href = '#',
  prefetch,
  onPointerEnter,
  onFocus,
  ...props
}: HoverPrefetchLinkProps) {
  const [hasIntent, setHasIntent] = useState(false)
  return (
    <NextLink
      {...props}
      href={href}
      prefetch={hasIntent ? prefetch : false}
      onPointerEnter={event => {
        setHasIntent(true)
        onPointerEnter?.(event)
      }}
      onFocus={event => {
        setHasIntent(true)
        onFocus?.(event)
      }}
    />
  )
}
