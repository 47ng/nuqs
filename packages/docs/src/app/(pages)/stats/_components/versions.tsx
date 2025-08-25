'use client'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/src/components/ui/chart'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Label } from '@/src/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Boxes } from 'lucide-react'
import { inferParserType, useQueryStates } from 'nuqs'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { formatDate, formatStatNumber } from '../lib/format'
import { pkgParser, searchParams } from '../searchParams'
import { Widget } from './widget'

type VersionProps = {
  records: Array<
    Record<
      | `${number}.${number}.${number}`
      | `${number}.${number}.${number}-beta.${number}`,
      number
    > & {
      date: string
    }
  >
  versions: string[]
}

// stroke-red-500 fill-red-500 bg-red-500 text-red-500
// stroke-amber-500 fill-amber-500 bg-amber-500 text-amber-500
// stroke-green-500 fill-green-500 bg-green-500 text-green-500
// stroke-blue-500 fill-blue-500 bg-blue-500 text-blue-500
// stroke-purple-500 fill-purple-500 bg-purple-500 text-purple-500

const lineColors = [
  'green-500',
  'amber-500',
  'red-500',
  'blue-500',
  'purple-500'
]

export function Versions({ records, versions }: VersionProps) {
  const [{ pkg: activeTab, beta }, setSearchParams] = useQueryStates(
    searchParams,
    { shallow: false }
  )
  return (
    <Widget
      className="lg:col-span-2"
      title={
        <>
          <Boxes size={24} strokeWidth={1.5} />
          Version adoption
          <Label className="ml-auto flex items-center gap-2">
            <Checkbox
              id="beta"
              checked={beta}
              onCheckedChange={checked =>
                setSearchParams({ beta: checked === true })
              }
            />
            Beta
          </Label>
          <Tabs
            className="ml-1 w-auto"
            value={activeTab}
            onValueChange={value =>
              setSearchParams({
                pkg: value as inferParserType<typeof pkgParser>
              })
            }
          >
            <TabsList>
              <TabsTrigger
                value="nuqs"
                className="data-[state=active]:text-red-700 dark:data-[state=active]:text-red-400"
              >
                nuqs
              </TabsTrigger>
              <TabsTrigger value="next-usequerystate">
                next-usequerystate
              </TabsTrigger>
              <TabsTrigger
                value="both"
                className="data-[state=active]:text-green-700 dark:data-[state=active]:text-green-300"
              >
                combined
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </>
      }
    >
      <ul className="flex justify-end gap-4 pt-2 text-sm text-zinc-500">
        {versions.map((version, index) => (
          <li key={version} className="flex items-center">
            <svg
              role="presentation"
              className="mr-1 inline h-4 w-4"
              viewBox="0 0 16 16"
              fill={`var(--color-${lineColors[index]})`}
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8" cy="8" r="4.5" />
            </svg>
            {version}
          </li>
        ))}
      </ul>
      <ChartContainer className="mt-2 h-74 w-full pr-1">
        <LineChart
          // accessibilityLayer // note: Causes a bug with Recharts 2.15.4 where a click on the chart moves the cursor to the first data point.
          data={records}
        >
          <YAxis
            width={30}
            fillOpacity={0.75}
            axisLine={false}
            tickLine={false}
            tickFormatter={value => formatStatNumber(value)}
            allowDataOverflow
          />
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            padding={{ left: 20, right: 20 }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
            tickMargin={10}
            fillOpacity={0.75}
            tickFormatter={value =>
              formatDate(value, '', { day: '2-digit', month: 'short' })
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
          {versions.map((version, index) => (
            <Line
              isAnimationActive={false}
              key={version}
              dataKey={version}
              type="monotone"
              stroke={`var(--color-${lineColors[index]})`}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </Widget>
  )
}
