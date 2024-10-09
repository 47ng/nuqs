'use client'

import { cn } from '@/src/lib/utils'
import { BarChart, List, ListItem, Tab, TabGroup, TabList } from '@tremor/react'
import { Star } from 'lucide-react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { formatStatNumber } from '../lib/format'
import { GitHubStarHistory } from '../lib/github'
import { Widget } from './widget'

type StarsGraphProps = {
  data: GitHubStarHistory
}

// fill-amber-500
// text-amber-500

const starTabs = ['earned', 'gazers'] as const

export function StarsGraph({ data }: StarsGraphProps) {
  const [activeTab, setActiveTab] = useQueryState(
    'stars',
    parseAsStringLiteral(starTabs).withDefault('earned')
  )
  const stargarzers = data.bins.flatMap(b => b.stargarzers)
  return (
    <Widget
      title={
        <>
          <Star size={20} /> {data.count}
          <TabGroup
            className="ml-auto w-auto"
            index={starTabs.indexOf(activeTab)}
            onIndexChange={index => setActiveTab(starTabs[index])}
          >
            <TabList variant="solid">
              <Tab className="ui-selected:text-amber-700 dark:ui-selected:text-amber-500">
                Stars earned
              </Tab>
              <Tab className="ui-selected:text-amber-700 dark:ui-selected:text-amber-500">
                Stargazers
              </Tab>
            </TabList>
          </TabGroup>
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
      {activeTab === 'gazers' && (
        <List className="mt-4 max-h-72 overflow-y-auto overscroll-contain">
          {stargarzers.map(s => (
            <ListItem key={s.login + s.avatarUrl} className="flex-wrap gap-2">
              <a
                href={`https://github.com/${s.login}`}
                className="group flex items-center gap-2"
              >
                <img
                  src={s.avatarUrl}
                  alt={s.name ?? 'Unknown'}
                  className="h-5 w-5 rounded-full"
                />
                <span className="font-semibold text-foreground empty:hidden">
                  {s.name}
                </span>
                <span className="text-sm text-zinc-500 group-hover:underline">
                  {s.login}
                </span>
              </a>
              <span className="ml-auto flex items-center gap-2 text-zinc-500">
                <span className="font-semibold empty:hidden">{s.company}</span>
                <span
                  className={cn(
                    s.followers > 100 && 'text-blue-600 dark:text-blue-400/80',
                    s.followers > 500 && 'text-green-600 dark:text-green-400/70'
                  )}
                >
                  {formatStatNumber(s.followers)} followers
                </span>
              </span>
            </ListItem>
          ))}
        </List>
      )}
    </Widget>
  )
}
