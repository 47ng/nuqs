'use client'

import { parseAsInteger, useQueryState, useQueryStates } from 'nuqs'
import { searchParams, urlKeys } from './search-params'

export function Client() {
  const [timeMs, setTimeMs] = useQueryState(
    'debounceTime',
    parseAsInteger.withDefault(100).withOptions({
      limitUrlUpdates: {
        method: 'throttle',
        timeMs: 200
      }
    })
  )
  const [{ search, pageIndex }, setSearchParams] = useQueryStates(
    searchParams,
    {
      shallow: false,
      urlKeys
    }
  )
  return (
    <>
      <input
        value={search}
        onChange={e =>
          setSearchParams(
            { search: e.target.value },
            {
              limitUrlUpdates: {
                method: e.target.value === '' ? 'throttle' : 'debounce',
                timeMs: e.target.value === '' ? 50 : timeMs
              }
            }
          )
        }
      />
      <button onClick={() => setSearchParams({ pageIndex: pageIndex + 1 })}>
        Next Page
      </button>
      <button
        onClick={() => {
          setTimeMs(null)
          setSearchParams(null, {
            limitUrlUpdates: {
              method: 'throttle',
              timeMs: 50
            }
          })
        }}
      >
        Reset
      </button>
      <div style={{ marginTop: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="range"
            value={timeMs}
            onChange={e => setTimeMs(e.target.valueAsNumber)}
            step={100}
            min={100}
            max={2000}
          />
          Search debounce time: {timeMs}ms
        </label>
      </div>
    </>
  )
}
