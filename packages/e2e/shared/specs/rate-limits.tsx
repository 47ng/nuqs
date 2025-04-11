'use client'

import { parseAsInteger, useQueryState } from 'nuqs'
import { useCallback, useReducer } from 'react'

const UPDATE_RATE_MS = 20
const RUN_TIME_MS = 60_000

type UpdateSuccess = {
  outcome: 'success'
  time: number
  searchParams: URLSearchParams
}
type UpdateFailure = {
  outcome: 'failure'
  time: number
  error: unknown
}

type UpdateOutcome = UpdateSuccess | UpdateFailure

type TestHookResult = {
  start: () => void
  stop: () => void
  reset: () => void
  startedAt: number | null
  currentCount: number
  successfulUpdates: UpdateSuccess[]
  failedUpdates: UpdateFailure[]
}

type ReducerState = {
  successfulUpdates: UpdateSuccess[]
  failedUpdates: UpdateFailure[]
  controller: AbortController | null
  startedAt: number | null
}

type ReducerAction =
  | { type: 'start'; payload: AbortController }
  | { type: 'stop' }
  | { type: 'reset' }
  | { type: 'update'; payload: UpdateOutcome }

function reducer(state: ReducerState, action: ReducerAction): ReducerState {
  performance.mark(`[nuqs] dispatch ${JSON.stringify(action)}`)
  switch (action.type) {
    case 'start':
      state.controller?.abort()
      return {
        ...state,
        startedAt: performance.now(),
        controller: action.payload
      }
    case 'stop':
      state.controller?.abort()
      return {
        ...state,
        controller: null,
        startedAt: null
      }
    case 'reset':
      return {
        ...state,
        successfulUpdates: [],
        failedUpdates: []
      }
    case 'update':
      const key =
        action.payload.outcome === 'success'
          ? 'successfulUpdates'
          : 'failedUpdates'
      if (
        state[key].findIndex(
          (u: UpdateOutcome) => u.time === action.payload.time
        ) !== -1
      ) {
        return state
      }
      return {
        ...state,
        [key]: [...state[key], action.payload]
      }
    default:
      throw new Error(`Unknown action type for ${action}`)
  }
}

const initialState: ReducerState = {
  successfulUpdates: [],
  failedUpdates: [],
  controller: null,
  startedAt: null
}

function useRateLimitTest(): TestHookResult {
  const [currentCount, setCount] = useQueryState(
    'count',
    parseAsInteger.withDefault(0)
  )
  const [state, dispatch] = useReducer(reducer, initialState)

  const start = useCallback(() => {
    const controller = new AbortController()
    dispatch({
      type: 'start',
      payload: controller
    })
    const signal = controller.signal
    const timeout = setTimeout(() => dispatch({ type: 'stop' }), RUN_TIME_MS)
    let i = 1
    const interval = setInterval(() => {
      try {
        setCount(i++)
          .then(searchParams => {
            dispatch({
              type: 'update',
              payload: {
                outcome: 'success',
                time: performance.now(),
                searchParams
              }
            })
          })
          .catch(error => {
            dispatch({
              type: 'update',
              payload: {
                outcome: 'failure',
                time: performance.now(),
                error
              }
            })
          })
      } catch (error) {
        dispatch({
          type: 'update',
          payload: {
            outcome: 'failure',
            time: performance.now(),
            error
          }
        })
      }
    }, UPDATE_RATE_MS)
    signal.addEventListener('abort', () => {
      clearTimeout(timeout)
      clearInterval(interval)
    })
  }, [])
  const stop = useCallback(() => dispatch({ type: 'stop' }), [])
  const reset = useCallback(() => {
    setCount(null)
    dispatch({ type: 'reset' })
  }, [])

  return {
    start,
    stop,
    reset,
    currentCount,
    startedAt: state.startedAt,
    failedUpdates: state.failedUpdates,
    successfulUpdates: state.successfulUpdates
  }
}

export function RateLimits() {
  const {
    currentCount,
    startedAt,
    successfulUpdates,
    failedUpdates,
    reset,
    start,
    stop
  } = useRateLimitTest()

  return (
    <>
      <button onClick={start} disabled={startedAt !== null}>
        Start
      </button>
      <button onClick={stop} disabled={startedAt === null}>
        Stop
      </button>
      <button onClick={reset} disabled={startedAt !== null}>
        Reset
      </button>
      <p>Count: {currentCount}</p>
      <p>Total: {successfulUpdates.length + failedUpdates.length}</p>
      <p>Success: {successfulUpdates.length}</p>
      <p>Errors: {failedUpdates.length}</p>
      {failedUpdates.length > 0 && (
        <ul>
          {failedUpdates.map(({ time, error }, i) => (
            <li key={i}>
              +{time - (startedAt ?? 0)}: {String(error)}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
