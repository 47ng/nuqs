'use client'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/src/components/ui/chart'
import {
  CartesianGrid,
  Customized,
  Line,
  LineChart,
  XAxis,
  YAxis
} from 'recharts'
import { formatDate, formatStatNumber } from '../lib/format'
import type { Datum, MultiDatum } from '../lib/npm'
import { useDynamicDasharray } from './partial-line-chart'
import { Widget, WidgetProps } from './widget'

type DownloadsGraphProps = WidgetProps & {
  data: (Datum | MultiDatum)[]
  partialLast: boolean
}

// stroke-red-500 fill-red-500 bg-red-500
// stroke-zinc-500/50 fill-zinc-500/50 bg-zinc-500/50

export function DownloadsGraph({
  data,
  partialLast,
  ...props
}: DownloadsGraphProps) {
  const [DasharrayCalculator, lineDashArrays] = useDynamicDasharray({
    splitIndex: data.length - 2
  })
  return (
    <Widget {...props}>
      <ChartContainer className="mt-2 h-84 w-full pr-1">
        <LineChart
          // accessibilityLayer // note: Causes a bug with Recharts 2.15.4 where a click on the chart moves the cursor to the first data point.
          // Bug is fixed in Recharts v3 (but v3 breaks the <Customized> component for the partial line dashes)
          data={data}
          margin={{ top: 10, right: 5, bottom: 5, left: 5 }}
        >
          <YAxis
            width={40}
            fillOpacity={0.75}
            axisLine={false}
            tickLine={false}
            tickFormatter={value =>
              value === 0 ? '' : formatStatNumber(value)
            }
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
            strokeDasharray={
              partialLast
                ? lineDashArrays.find(line => line.name === 'nuqs')
                    ?.strokeDasharray || '0 0'
                : '0 0'
            }
          />
          <Line
            dataKey="next-usequerystate"
            isAnimationActive={false}
            type="monotone"
            stroke="var(--color-zinc-500)"
            strokeOpacity={0.5}
            dot={false}
            strokeWidth={2}
            strokeDasharray={
              partialLast
                ? lineDashArrays.find(
                    line => line.name === 'next-usequerystate'
                  )?.strokeDasharray || '0 0'
                : '0 0'
            }
          />
          <Customized component={DasharrayCalculator} />
        </LineChart>
      </ChartContainer>
    </Widget>
  )
}
