'use client'

import { Card, LineChart } from '@tremor/react'
import { formatStatNumber } from '../lib/format'

type TremorTestProps = {
  data: any
}

export function TremorTest({ data }: TremorTestProps) {
  return (
    <Card className="dark:bg-background">
      <LineChart
        className="h-80"
        data={data}
        categories={['nuqs']}
        index="date"
        tickGap={40}
        colors={['red-500']}
        valueFormatter={value => formatStatNumber(value)}
        curveType="natural"
        yAxisWidth={30}
        onValueChange={v => console.log(v)}
      />
    </Card>
  )
}
