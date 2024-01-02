'use client'

import {
  parseAsBoolean,
  parseAsInteger,
  useQueryState
} from 'next-usequerystate'
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { VersionRecord } from '../lib/versions'

type VersionAdoptionGraphProps = {
  records: VersionRecord[]
}

const strokes = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#ff0000',
  '#00ff00',
  '#0000ff'
]

export default function VersionAdoptionGraph({
  records
}: VersionAdoptionGraphProps) {
  const [relative, setRelative] = useQueryState(
    'versionsRelative',
    parseAsBoolean.withDefault(false)
  )
  const [limit, setLimit] = useQueryState(
    'versionsLimit',
    parseAsInteger.withDefault(5)
  )
  const versionsToShow = Object.entries(records.at(-1)?.relative ?? {})
    .slice(0, limit)
    .map(([key, _]) => key)
  const latest = records.at(-1)?.latest ?? ''
  return (
    <div className="relative row-span-2 min-h-[16rem] rounded border">
      <ResponsiveContainer className="absolute inset-0 z-0 text-xs">
        <LineChart
          data={records.map(r => (relative ? r.relative : r.downloads))}
          margin={{ top: 20, bottom: 10 }}
          accessibilityLayer
        >
          <XAxis dataKey="date" />
          <YAxis
            tickFormatter={(value: number) => {
              return relative ? `${(value * 100).toFixed()}%` : value.toFixed()
            }}
          />
          <Tooltip
            wrapperClassName="rounded-lg z-50"
            contentStyle={{
              backgroundColor: 'black',
              borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
            formatter={(value: number) => {
              return relative ? `${(value * 100).toFixed(2)}%` : value.toFixed()
            }}
          />
          <Legend verticalAlign="bottom" />
          {versionsToShow.map((version, i) => (
            <Line
              key={version}
              type="monotone"
              dataKey={version}
              stroke={strokes[i % strokes.length]}
              strokeWidth={version === latest ? 4 : 1.5}
              dot={{ r: 1 }}
              animationDuration={250}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <nav className="absolute right-0 top-0 z-40 flex h-8 text-xs">
        <label className="flex items-center px-2">
          <input
            type="checkbox"
            className="mr-2"
            checked={relative}
            onChange={e => setRelative(e.target.checked)}
          />
          Relative
        </label>
        <label className="flex items-center px-2">
          <span className="mr-2">Limit</span>
          <input
            type="number"
            className="w-12 rounded border px-1"
            value={limit}
            min={1}
            max={9}
            onChange={e => setLimit(e.target.valueAsNumber)}
          />
        </label>
      </nav>
    </div>
  )
}
