'use client'

import { useEffect, useRef, type ComponentProps } from 'react'

type AnchoredDetailsProps = ComponentProps<'details'> & { id: string }

export function AnchoredDetails({ id, ...props }: AnchoredDetailsProps) {
  const ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    function openWhenTargeted() {
      if (window.location.hash !== `#${id}` || !ref.current) {
        return
      }
      ref.current.open = true
      ref.current.scrollIntoView()
    }
    openWhenTargeted()
    window.addEventListener('hashchange', openWhenTargeted)
    return () => window.removeEventListener('hashchange', openWhenTargeted)
  }, [id])
  return <details ref={ref} id={id} {...props} />
}
