'use client'

import { LineChart } from '@tremor/react'
import { formatStatNumber } from '../lib/format'
import type { Datum, MultiDatum } from '../lib/npm'
import { Widget, WidgetProps } from './widget'

type DownloadsGraphProps = WidgetProps & {
  data: (Datum | MultiDatum)[]
  dataKeys: string[]
}

// stroke-red-500 fill-red-500 bg-red-500
// stroke-zinc-500/50 fill-zinc-500/50 bg-zinc-500/50

export function DownloadsGraph({
  data,
  dataKeys,
  ...props
}: DownloadsGraphProps) {
  return (
    <Widget {...props}>
      <LineChart
        data={data}
        curveType="monotone"
        index="date"
        tickGap={40}
        yAxisWidth={30}
        categories={dataKeys}
        colors={['red-500', 'zinc-500/50']}
        valueFormatter={v => formatStatNumber(v)}
      />
    </Widget>
  )
}
