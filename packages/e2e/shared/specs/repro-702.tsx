'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useRef } from 'react'

export function Repro702() {
  return (
    <>
      <TriggerA />
      <TriggerB />
      <SwitchComponentA />
      <SwitchComponentB />
    </>
  )
}

// using useQueryState
function TriggerA() {
  const [, setState] = useQueryState('a')
  return (
    <button id="trigger-a" onClick={() => setState('test')}>
      Trigger A (via useQueryState)
    </button>
  )
}

// using useQueryStates
function TriggerB() {
  const [, setState] = useQueryStates({
    b: parseAsString
  })
  return (
    <button id="trigger-b" onClick={() => setState({ b: 'test' })}>
      Trigger B (via useQueryStates)
    </button>
  )
}

function SwitchComponentA() {
  const [x] = useQueryState('a')
  if (x === 'test') {
    return <ConditionalComponentA />
  }
  return null
}

function SwitchComponentB() {
  const [x] = useQueryState('b')
  if (x === 'test') {
    return <ConditionalComponentB />
  }
  return null
}

function ConditionalComponentA() {
  const nullCheckUseQueryState = useRef(false)
  const nullCheckUseQueryStates = useRef(false)
  console.log('start render conditional a')
  const [fromUseQueryState] = useQueryState('a')
  const [{ a: fromUseQueryStates }] = useQueryStates({ a: parseAsString })
  console.log('end render conditional a', fromUseQueryState, fromUseQueryStates)

  if (fromUseQueryState === null) {
    nullCheckUseQueryState.current = true
  }
  if (fromUseQueryStates === null) {
    nullCheckUseQueryStates.current = true
  }

  return (
    <>
      <div id="conditional-a-useQueryState">
        {fromUseQueryState} {nullCheckUseQueryState.current ? 'fail' : 'pass'}
      </div>
      <div id="conditional-a-useQueryStates">
        {fromUseQueryStates} {nullCheckUseQueryStates.current ? 'fail' : 'pass'}
      </div>
    </>
  )
}

function ConditionalComponentB() {
  const nullCheckUseQueryState = useRef(false)
  const nullCheckUseQueryStates = useRef(false)
  const [fromUseQueryState] = useQueryState('b')
  const [{ b: fromUseQueryStates }] = useQueryStates({ b: parseAsString })

  if (fromUseQueryState === null) {
    nullCheckUseQueryState.current = true
  }
  if (fromUseQueryStates === null) {
    nullCheckUseQueryStates.current = true
  }
  return (
    <>
      <div id="conditional-b-useQueryState">
        {fromUseQueryState} {nullCheckUseQueryState.current ? 'fail' : 'pass'}
      </div>
      <div id="conditional-b-useQueryStates">
        {fromUseQueryStates} {nullCheckUseQueryStates.current ? 'fail' : 'pass'}
      </div>
    </>
  )
}
