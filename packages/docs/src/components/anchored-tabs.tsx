'use client'

import { Tabs, type TabsProps } from 'fumadocs-ui/components/tabs'
import { useEffect, useRef, useState } from 'react'

export function AnchoredTabs(props: TabsProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [targetedHash, setTargetedHash] = useState('')
  useEffect(() => {
    function remountWhenTargeted() {
      const id = window.location.hash.slice(1)
      if (id && ref.current?.querySelector(`#${CSS.escape(id)}`)) {
        setTargetedHash(id)
      }
    }
    window.addEventListener('hashchange', remountWhenTargeted)
    return () => window.removeEventListener('hashchange', remountWhenTargeted)
  }, [])
  return (
    <div ref={ref}>
      <Tabs key={targetedHash} updateAnchor {...props} />
    </div>
  )
}
