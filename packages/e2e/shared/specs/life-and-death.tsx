'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { Display } from '../components/display'
import { NullDetector } from '../components/null-detector'

export function LifeAndDeath() {
  return (
    <>
      <LifeAndDeathUseQueryState />
      <LifeAndDeathUseQueryStates />
    </>
  )
}

const useQueryStateTest = () => useQueryState('test')
const useQueryStatesTest = () => useQueryStates({ test: parseAsString })

function LifeAndDeathUseQueryState() {
  const [test, setTest] = useQueryStateTest()
  return (
    <div>
      <button id="set-useQueryState" onClick={() => setTest('pass')}>
        Test useQueryState
      </button>
      {test === 'pass' ? <ChildComponentUseQueryState /> : null}
    </div>
  )
}

function ChildComponentUseQueryState() {
  const [test, setTest] = useQueryStateTest()
  return (
    <>
      <button id="clear-useQueryState" onClick={() => setTest(null)}>
        Clear
      </button>
      <Display environment="client" target="useQueryState" state={test} />
      <NullDetector throwOnNull id="null-detector-useQueryState" state={test} />
    </>
  )
}

// --

function LifeAndDeathUseQueryStates() {
  const [{ test }, setTest] = useQueryStatesTest()
  return (
    <div>
      <button id="set-useQueryStates" onClick={() => setTest({ test: 'pass' })}>
        Test useQueryStates
      </button>
      {test === 'pass' ? <ChildComponentUseQueryStates /> : null}
    </div>
  )
}

function ChildComponentUseQueryStates() {
  const [{ test }, setTest] = useQueryStatesTest()
  return (
    <>
      <button id="clear-useQueryStates" onClick={() => setTest({ test: null })}>
        Clear
      </button>
      <Display environment="client" target="useQueryStates" state={test} />
      <NullDetector
        throwOnNull
        id="null-detector-useQueryStates"
        state={test}
      />
    </>
  )
}
