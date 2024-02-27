'use client'

import { LineChart, Tab, TabGroup, TabList } from '@tremor/react'
import { Boxes } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { formatStatNumber } from '../lib/format'
import { pkgOptions, pkgParser } from '../searchParams'
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

export function Versions({ records, versions }: VersionProps) {
  const [activeTab, setActiveTab] = useQueryState(
    'pkg',
    pkgParser.withOptions({
      shallow: false
    })
  )
  return (
    <Widget
      className="lg:col-span-2"
      title={
        <>
          <Boxes size={24} strokeWidth={1.5} />
          Version adoption
          <TabGroup
            className="ml-auto w-auto"
            index={pkgOptions.indexOf(activeTab)}
            onIndexChange={index => setActiveTab(pkgOptions[index])}
          >
            <TabList variant="solid">
              <Tab>nuqs</Tab>
              <Tab>next-usequerystate</Tab>
              <Tab>combined</Tab>
            </TabList>
          </TabGroup>
        </>
      }
    >
      <LineChart
        data={records}
        curveType="monotone"
        tickGap={40}
        yAxisWidth={30}
        categories={versions}
        index="date"
        colors={['green-500', 'amber-500', 'red-500', 'blue-500', 'purple-500']}
        valueFormatter={v => formatStatNumber(v)}
      />
    </Widget>
  )
}
