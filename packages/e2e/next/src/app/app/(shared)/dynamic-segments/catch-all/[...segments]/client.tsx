'use client'

import { DisplaySegments } from 'e2e-shared/specs/dynamic-segments'
import { useParams } from 'next/navigation'
import { ReactNode } from 'react'

export function ClientSegment({ children }: { children?: ReactNode }) {
  const params = useParams()
  const segments = params?.segments as string[]
  return (
    <>
      {children}
      <DisplaySegments environment="client" segments={segments} />
    </>
  )
}
