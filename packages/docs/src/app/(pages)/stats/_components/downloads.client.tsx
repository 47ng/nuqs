'use client'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/src/components/ui/chart'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { formatDate, formatStatNumber } from '../lib/format'
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
      <ChartContainer className="mt-2 h-84 w-full pr-1">
        <LineChart
          accessibilityLayer
          data={data}
          margin={{ top: 10, right: 5, bottom: 5, left: 5 }}
        >
          <YAxis
            width={40}
            fillOpacity={0.75}
            axisLine={false}
            tickLine={false}
            tickFormatter={value => formatStatNumber(value)}
            allowDataOverflow
          />
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={40}
            tickMargin={10}
            fillOpacity={0.75}
            tickFormatter={value =>
              value.startsWith("'")
                ? value
                : formatDate(value, '', { day: '2-digit', month: 'short' })
            }
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                valueFormatter={value => formatStatNumber(value as number)}
              />
            }
            isAnimationActive={false}
            position={{ y: 20 }}
          />
          <Line
            dataKey="nuqs"
            isAnimationActive={false}
            type="monotone"
            stroke="var(--color-red-500)"
            className="stroke-red-500 dark:stroke-red-400"
            dot={false}
            strokeWidth={2}
          />
          <Line
            dataKey="next-usequerystate"
            isAnimationActive={false}
            type="monotone"
            stroke="var(--color-zinc-500)"
            strokeOpacity={0.5}
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ChartContainer>
    </Widget>
  )
}
