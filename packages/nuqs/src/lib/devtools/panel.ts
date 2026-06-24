import {
  createElement as h,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement
} from 'react'
import { clearEvents, getEvents, MAX_EVENTS } from './buffer'
import type { LogCategory } from './category'
import { eventClient, type NuqsLogEvent } from './events'

const CATEGORY_COLORS: Record<LogCategory, string> = {
  state: '#7dd3fc',
  throttle: '#fcd34d',
  debounce: '#fdba74',
  queue: '#f9a8d4',
  adapter: '#86efac',
  parse: '#fca5a5'
}

/**
 * The nuqs devtools panel: a live, filterable view of the debug log stream.
 * Renders inside a TanStack Devtools tab via
 * `<TanStackDevtools plugins={[{ name: 'nuqs', render: <NuqsDevtools /> }]} />`.
 */
export function NuqsDevtools(): ReactElement {
  const [events, setEvents] = useState<NuqsLogEvent[]>([])
  const [search, setSearch] = useState('')
  const [follow, setFollow] = useState(true)
  const lastSeenId = useRef(-1)
  const pending = useRef<NuqsLogEvent[]>([])
  const rafId = useRef<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // nuqs calls `debug()` during render/commit and the bus dispatches
    // synchronously, so appending directly here would set state while another
    // component renders. Batch into a ref and flush on an animation frame, which
    // decouples the update and coalesces bursts.
    const flush = () => {
      rafId.current = null
      const batch = pending.current
      if (batch.length === 0) return
      pending.current = []
      setEvents(prev => {
        const merged = prev.concat(batch)
        return merged.length > MAX_EVENTS
          ? merged.slice(merged.length - MAX_EVENTS)
          : merged
      })
    }
    const enqueue = (event: NuqsLogEvent) => {
      // Ids are monotonic, so a watermark dedups the backfill (incl. StrictMode's
      // double-invoke) in O(1) without an unbounded Set.
      if (event.id <= lastSeenId.current) return
      lastSeenId.current = event.id
      pending.current.push(event)
      rafId.current ??= requestAnimationFrame(flush)
    }
    // Subscribe first, then backfill from the buffer: a CustomEvent dispatch
    // can't interleave between these synchronous statements.
    const unsubscribe = eventClient.on('log', e => enqueue(e.payload))
    for (const event of getEvents()) enqueue(event)
    // Schedule the backfill flush explicitly: under StrictMode the first setup's
    // batch survives cleanup, and the second setup's re-backfill is fully
    // watermark-deduped, so no `enqueue` would reschedule it on its own.
    if (pending.current.length > 0) {
      rafId.current ??= requestAnimationFrame(flush)
    }
    return () => {
      unsubscribe()
      if (rafId.current != null) {
        // Null the handle too: leaving a stale id would make the `??=` guard in
        // `enqueue` skip rescheduling after a remount, so `flush` never runs.
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (follow && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [events, follow])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return events
    return events.filter(event => event.message.toLowerCase().includes(needle))
  }, [events, search])

  const onClear = () => {
    clearEvents()
    pending.current = []
    setEvents([])
  }

  const onScroll = () => {
    const el = listRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24
    if (atBottom !== follow) setFollow(atBottom)
  }

  return h(
    'div',
    { style: styles.root },
    h(
      'div',
      { style: styles.toolbar },
      h('input', {
        style: styles.search,
        placeholder: 'Filter (key, message…)',
        value: search,
        onChange: e => setSearch(e.currentTarget.value)
      }),
      h(
        'label',
        { style: styles.follow },
        h('input', {
          type: 'checkbox',
          checked: follow,
          onChange: e => setFollow(e.currentTarget.checked)
        }),
        'Follow'
      ),
      h('button', { style: styles.button, onClick: onClear }, 'Clear'),
      h(
        'span',
        { style: styles.count },
        `${filtered.length}/${events.length}`
      )
    ),
    h(
      'div',
      { ref: listRef, style: styles.list, onScroll },
      filtered.length === 0
        ? h('div', { style: styles.empty }, 'No events. Interact with the app.')
        : filtered.map(event => h(LogRow, { key: event.id, event }))
    )
  )
}

function LogRow({ event }: { event: NuqsLogEvent }): ReactElement {
  return h(
    'details',
    { style: styles.row },
    h(
      'summary',
      { style: styles.summary },
      h('span', { style: styles.time }, formatTime(event.ts)),
      h(
        'span',
        {
          style: {
            ...styles.badge,
            color: CATEGORY_COLORS[event.category]
          }
        },
        event.category
      ),
      event.level === 'warn'
        ? h('span', { style: styles.warn }, 'warn')
        : null,
      h('span', { style: styles.message }, event.message)
    ),
    h(
      'div',
      { style: styles.argsBox },
      event.args.length === 0
        ? h('span', { style: styles.muted }, '(no args)')
        : event.args.map((arg, i) => h(ArgView, { key: i, arg }))
    )
  )
}

function ArgView({ arg }: { arg: unknown }): ReactElement {
  if (arg instanceof URLSearchParams) {
    return h(
      'table',
      { style: styles.table },
      h(
        'tbody',
        null,
        Array.from(arg.entries()).map(([key, value], i) =>
          h(
            'tr',
            { key: i },
            h('td', { style: styles.tdKey }, key),
            h('td', { style: styles.tdValue }, value)
          )
        )
      )
    )
  }
  if (arg instanceof URL) {
    return h(
      'div',
      { style: styles.urlBox },
      h('div', null, h('b', null, 'URL '), arg.href),
      h(ArgView, { arg: arg.searchParams })
    )
  }
  if (arg instanceof Error) {
    return h(
      'pre',
      { style: { ...styles.pre, color: '#fca5a5' } },
      `${arg.name}: ${arg.message}\n${arg.stack ?? ''}`
    )
  }
  return h('pre', { style: styles.pre }, safeStringify(arg))
}

function safeStringify(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2) ?? String(value)
  } catch {
    return String(value)
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number, l = 2) => String(n).padStart(l, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

const mono =
  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'

const styles: Record<string, CSSProperties> = {
  // `margin: 0` on every element: the host page's global CSS (typography resets,
  // owl selectors) would otherwise inflate the flex toolbar's line height and
  // collapse the list.
  // Grid (not flex column): the host container triggers a flex-basis anomaly
  // that lets the auto-height toolbar balloon and collapse the list. A grid with
  // an `auto` toolbar row and a `minmax(0, 1fr)` scrollable list row is immune.
  root: {
    display: 'grid',
    gridTemplateRows: 'auto minmax(0, 1fr)',
    height: '100%',
    minHeight: 200,
    margin: 0,
    boxSizing: 'border-box',
    font: `12px/1.5 ${mono}`,
    color: '#e5e7eb',
    background: '#0b0f19'
  },
  toolbar: {
    display: 'flex',
    flexShrink: 0,
    gap: 8,
    alignItems: 'center',
    padding: 8,
    margin: 0,
    borderBottom: '1px solid #1f2937'
  },
  search: {
    flex: 1,
    margin: 0,
    padding: '4px 8px',
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: 4,
    color: '#e5e7eb',
    font: `12px ${mono}`
  },
  follow: {
    display: 'flex',
    gap: 4,
    margin: 0,
    alignItems: 'center',
    userSelect: 'none'
  },
  button: {
    padding: '4px 10px',
    margin: 0,
    background: '#1f2937',
    border: '1px solid #374151',
    borderRadius: 4,
    color: '#e5e7eb',
    cursor: 'pointer'
  },
  count: { color: '#6b7280', margin: 0, minWidth: 56, textAlign: 'right' },
  list: { minHeight: 0, overflow: 'auto', padding: 4, margin: 0 },
  empty: { padding: 16, color: '#6b7280', textAlign: 'center' },
  row: { borderBottom: '1px solid #111827' },
  summary: {
    display: 'flex',
    gap: 8,
    alignItems: 'baseline',
    padding: '3px 4px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden'
  },
  time: { color: '#4b5563', flexShrink: 0 },
  badge: { flexShrink: 0, fontWeight: 600 },
  warn: { color: '#fbbf24', flexShrink: 0 },
  message: { color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis' },
  argsBox: { padding: '4px 8px 8px 24px', display: 'grid', gap: 6 },
  muted: { color: '#6b7280' },
  pre: {
    margin: 0,
    padding: 8,
    background: '#111827',
    borderRadius: 4,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  table: { borderCollapse: 'collapse', background: '#111827', borderRadius: 4 },
  tdKey: {
    padding: '2px 8px',
    color: '#7dd3fc',
    borderBottom: '1px solid #1f2937'
  },
  tdValue: {
    padding: '2px 8px',
    color: '#e5e7eb',
    borderBottom: '1px solid #1f2937'
  },
  urlBox: { display: 'grid', gap: 4 }
}
