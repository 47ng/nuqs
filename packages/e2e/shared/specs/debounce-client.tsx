'use client'

import { debounce, useQueryStates } from 'nuqs'
import { Display } from '../components/display'
import { useLink } from '../components/link'
import { useRouter } from '../components/router'
import {
  demoControls,
  demoSearchParams,
  demoSearchParamsUrlKeys
} from './debounce.defs'

type DebounceProps = {
  navigateHref: string
}

export function DebounceClient({ navigateHref }: DebounceProps) {
  const [{ debounceTime: timeMs }, setControls] = useQueryStates(demoControls)
  const [{ search, pageIndex }, setSearchParams] = useQueryStates(
    demoSearchParams,
    {
      shallow: false,
      urlKeys: demoSearchParamsUrlKeys
    }
  )
  const Link = useLink()
  const router = useRouter()
  return (
    <>
      <Display
        environment="client"
        state={JSON.stringify({ search, pageIndex })}
      />
      <input
        type="text"
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
      <button
        id="increment-page-index"
        onClick={() =>
          setSearchParams(old => ({ pageIndex: old.pageIndex + 1 }))
        }
      >
        Page {pageIndex}
      </button>
      <button id="reset" onClick={() => setSearchParams(null)}>
        Reset
      </button>
      <button
        id="navigate-router-shallow-false"
        onClick={() => router.push(navigateHref, { shallow: false })}
      >
        Navigate with router
      </button>
      <Link href={navigateHref}>Navigate with Link</Link>
      <h2>Controls</h2>
      <div style={{ marginTop: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="range"
            value={timeMs}
            onChange={e =>
              setControls({ debounceTime: e.target.valueAsNumber })
            }
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
