'use client'

import { useQueryState, useQueryStates } from 'nuqs'
import type { ReactNode } from 'react'
import { Display, type DisplayProps } from '../components/display'
import { optionsSearchParams } from '../lib/options'

type UrlControlsProps = {
  children?: ReactNode
}

export function UrlControls({ children }: UrlControlsProps) {
  const [{ shallow, history }] = useQueryStates(optionsSearchParams)
  const [state, setState] = useQueryState('test', { shallow, history })
  return (
    <>
      <button onClick={() => setState('pass')}>Test</button>
      {children}
      <Display environment="client" state={state} />
    </>
  )
}

// --

type DisplaySegmentsProps = Pick<DisplayProps, 'environment'> & {
  segments: string[] | undefined
}

export function DisplaySegments({
  segments,
  environment
}: DisplaySegmentsProps) {
  return (
    <Display
      environment={environment}
      target="segments"
      state={JSON.stringify(segments)}
    />
  )
}
