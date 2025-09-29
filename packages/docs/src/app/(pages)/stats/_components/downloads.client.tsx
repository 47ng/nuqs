'use client'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from '@/src/components/ui/chart'
import type { ReactNode } from 'react'
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
  trend: ReactNode
}

export function DownloadsGraph({
  data,
  partialLast,
  trend,
  ...props
}: DownloadsGraphProps) {
  const [DasharrayCalculator, lineDashArrays] = useDynamicDasharray({
    splitIndex: data.length - 2
  })
  return (
    <Widget {...props}>
      <ChartContainer
        className="relative h-85.5 w-full pr-1"
        config={{
          nuqs: {
            label: 'nuqs'
          },
          'next-usequerystate': {
            label: 'next-usequerystate'
          }
        }}
        domChildren={<div className="absolute top-1.25 left-1">{trend}</div>}
      >
        <LineChart
          // accessibilityLayer // note: Causes a bug with Recharts 2.15.4 where a click on the chart moves the cursor to the first data point.
          // Bug is fixed in Recharts v3 (but v3 breaks the <Customized> component for the partial line dashes)
          data={data}
          margin={{ top: 5, right: 0, bottom: 5, left: 5 }}
        >
          <YAxis
            width={40}
            fillOpacity={0.75}
            axisLine={false}
            tickLine={false}
            tickFormatter={value => formatStatNumber(value)}
            allowDataOverflow
          />
          <ChartLegend
            align="right"
            verticalAlign="top"
            content={<ChartLegendContent />}
          />
          <CartesianGrid vertical={false} />
          <XAxis
            padding={{ left: 20, right: 20 }}
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
