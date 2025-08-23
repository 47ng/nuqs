'use client'

import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { BarChart } from '@tremor/react'
import { Star } from 'lucide-react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { formatStatNumber } from '../lib/format'
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
      className="pb-0"
      title={
        <>
          <Star size={20} /> {data.count}
          <Tabs
            className="ml-auto w-auto"
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
        <BarChart
          data={data.bins
            .toReversed()
            .map(b => ({ ...b, 'Stars earned': b.diff }))}
          index="date"
          categories={['Stars earned']}
          colors={['amber-500']}
          showLegend={false}
          tickGap={40}
          yAxisWidth={30}
          valueFormatter={v => formatStatNumber(v)}
        />
      )}
      {activeTab === 'gazers' && stargazersTab}
    </Widget>
  )
}
