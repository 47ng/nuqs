'use client'

import {
  debounce,
  parseAsInteger,
  throttle,
  useQueryState,
  useQueryStates
} from 'nuqs'
import { searchParams, urlKeys } from './search-params'

export function Client() {
  const [timeMs, setTimeMs] = useQueryState(
    'debounceTime',
    parseAsInteger.withDefault(100).withOptions({
      // No real need to throttle this one, but it showcases usage:
      limitUrlUpdates: throttle(200)
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
              // Instant update when clearing the input, otherwise debounce
              limitUrlUpdates:
                e.target.value === '' ? undefined : debounce(timeMs)
            }
          )
        }
        onKeyDown={e => {
          if (e.key === 'Enter') {
            // Send the search immediately when pressing Enter
            setSearchParams({ search: e.currentTarget.value })
          }
        }}
      />
      <button onClick={() => setSearchParams({ pageIndex: pageIndex + 1 })}>
        Next Page
      </button>
      <button onClick={() => setSearchParams(null)}>Reset</button>
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
