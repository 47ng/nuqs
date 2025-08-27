'use client'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/src/components/ui/chart'
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Star } from 'lucide-react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { formatDate } from '../lib/format'
import { GitHubStarHistory } from '../lib/github'
import { Widget } from './widget'

type StarsGraphProps = {
  data: GitHubStarHistory
  stargazersTab: React.ReactNode
}

const starTabs = ['earned', 'gazers'] as const
type StarTab = (typeof starTabs)[number]

export function StarsGraph({ data, stargazersTab }: StarsGraphProps) {
  const [activeTab, setActiveTab] = useQueryState(
    'stars',
    parseAsStringLiteral(starTabs).withDefault('earned')
  )

  return (
    <Widget
      className="px-0 pb-0"
      title={
        <>
          <Star size={20} className="ml-2" /> {data.count}
          <Tabs
            className="mr-2 ml-auto w-auto"
            value={activeTab}
            onValueChange={value => setActiveTab(value as StarTab)}
          >
            <TabsList>
              <TabsTrigger
                className="data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-500"
                value="earned"
              >
                Stars earned
              </TabsTrigger>
              <TabsTrigger
                className="data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-500"
                value="gazers"
              >
                Stargazers
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </>
      }
    >
      {activeTab === 'earned' && (
        <ChartContainer className="mt-2 h-82 w-full px-2">
          <BarChart
            // accessibilityLayer // note: Causes a bug with Recharts 2.15.4 where a click on the chart moves the cursor to the first data point.
            data={data.bins.toReversed().map(b => ({ ...b, Stars: b.diff }))}
          >
            <YAxis
              axisLine={false}
              width={30}
              tickLine={false}
              fillOpacity={0.75}
            />
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              fillOpacity={0.75}
              tickFormatter={value =>
                formatDate(value, '', { day: '2-digit', month: 'short' })
              }
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fillOpacity: 0.5 }}
              isAnimationActive={false}
              position={{ y: 20 }}
            />
            <Bar
              isAnimationActive={false}
              shape={<CustomGradientBar />}
              dataKey="Stars"
              fill="var(--color-amber-500)"
            />
          </BarChart>
        </ChartContainer>
      )}
      {activeTab === 'gazers' && stargazersTab}
    </Widget>
  )
}

const CustomGradientBar = (
  props: React.SVGProps<SVGRectElement> & { dataKey?: string }
) => {
  const { fill, x, y, width, height, dataKey } = props
  return (
    <>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        stroke="none"
        fill={`url(#gradient-bar-pattern-${dataKey})`}
      />
      <rect x={x} y={y} width={width} height={2} stroke="none" fill={fill} />
      <defs>
        <linearGradient
          id={`gradient-bar-pattern-${dataKey}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={fill} stopOpacity={0.2} />
          <stop offset="100%" stopColor={fill} stopOpacity={0} />
        </linearGradient>
      </defs>
    </>
  )
}
