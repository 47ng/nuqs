// Big thanks to Legion from Evil Charts for this! 🙏
// https://evilcharts.com

'use client'

import { useCallback, useState } from 'react'

// Example usage:
// export function PartialLineChart() {
//   const [DasharrayCalculator, lineDasharrays] = useDynamicDasharray({
//     splitIndex: chartData.length - 2
//   })
//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Partial Line Chart</CardTitle>
//         <CardDescription>January - June 2025</CardDescription>
//       </CardHeader>
//       <CardContent>
//         <ChartContainer className="h-54 w-full" config={chartConfig}>
//           <LineChart
//             accessibilityLayer
//             data={chartData}
//             margin={{
//               left: 12,
//               right: 12
//             }}
//           >
//             <CartesianGrid vertical={false} />
//             <XAxis
//               dataKey="month"
//               tickLine={false}
//               axisLine={false}
//               tickMargin={8}
//               tickFormatter={value => value.slice(0, 3)}
//             />
//             <ChartTooltip
//               cursor={false}
//               content={<ChartTooltipContent hideLabel />}
//             />
//             {Object.entries(chartConfig).map(([key, value]) => (
//               <Line
//                 key={key}
//                 dataKey={key}
//                 isAnimationActive={false}
//                 type="monotone"
//                 stroke={value.color}
//                 dot={{
//                   r: 2.5,
//                   fill: value.color
//                 }}
//                 strokeDasharray={
//                   lineDasharrays.find(line => line.name === key)
//                     ?.strokeDasharray || '0 0'
//                 }
//               />
//             ))}
//             <Customized component={DasharrayCalculator} />
//           </LineChart>
//         </ChartContainer>
//       </CardContent>
//     </Card>
//   )
// }

interface ChartDataPoint {
  x?: number
  y?: number
  value?: number | string
  payload?: Record<string, unknown>
}

interface ChartLineData {
  item: {
    props: {
      dataKey: string
    }
  }
  props: {
    points: ChartDataPoint[]
  }
}

interface CustomizedChartProps {
  formattedGraphicalItems?: ChartLineData[]
}

interface LineConfig {
  name: string
  splitIndex?: number
  dashPattern?: number[]
  curveAdjustment?: number
}

interface UseDynamicDasharrayProps {
  lineConfigs?: LineConfig[]
  splitIndex?: number
  defaultDashPattern?: number[]
  curveAdjustment?: number
}

type LineDasharray = {
  name: string
  strokeDasharray: string
}[]

export function useDynamicDasharray({
  lineConfigs = [],
  splitIndex = -2,
  defaultDashPattern: dashPattern = [5, 3],
  curveAdjustment = 1
}: UseDynamicDasharrayProps): [
  (props: CustomizedChartProps) => null,
  LineDasharray
] {
  const [lineDasharrays, setLineDasharrays] = useState<LineDasharray>([])

  const DasharrayCalculator = useCallback(
    (props: CustomizedChartProps): null => {
      const chartLines = props?.formattedGraphicalItems
      const newLineDasharrays: LineDasharray = []

      const calculatePathLength = (points: ChartDataPoint[]) => {
        return (
          points?.reduce((acc, point, index) => {
            if (index === 0) return acc

            const prevPoint = points[index - 1]

            const dx = (point.x || 0) - (prevPoint.x || 0)
            const dy = (point.y || 0) - (prevPoint.y || 0)

            acc += Math.sqrt(dx * dx + dy * dy)
            return acc
          }, 0) || 0
        )
      }

      chartLines?.forEach(line => {
        const points = line?.props?.points
        const totalLength = calculatePathLength(points || [])

        const lineName = line?.item?.props?.dataKey
        const lineConfig = lineConfigs?.find(
          config => config?.name === lineName
        )
        const lineSplitIndex = lineConfig?.splitIndex ?? splitIndex
        const dashedSegment = points?.slice(lineSplitIndex)
        const dashedLength = calculatePathLength(dashedSegment || [])

        if (!totalLength || !dashedLength) return

        const solidLength = totalLength - dashedLength
        const curveCorrectionFactor =
          lineConfig?.curveAdjustment ?? curveAdjustment
        const adjustment = (solidLength * curveCorrectionFactor) / 100
        const solidDasharrayPart = solidLength + adjustment

        const targetDashPattern = lineConfig?.dashPattern || dashPattern
        const patternSegmentLength =
          (targetDashPattern?.[0] || 0) + (targetDashPattern?.[1] || 0) || 1
        const repetitions = Math.ceil(dashedLength / patternSegmentLength)
        const dashedPatternSegments = Array.from({ length: repetitions }, () =>
          targetDashPattern.join(' ')
        )

        const finalDasharray = `${solidDasharrayPart} ${dashedPatternSegments.join(
          ' '
        )}`
        newLineDasharrays.push({
          name: lineName!,
          strokeDasharray: finalDasharray
        })
      })

      if (
        JSON.stringify(newLineDasharrays) !== JSON.stringify(lineDasharrays)
      ) {
        setTimeout(() => setLineDasharrays(newLineDasharrays), 0)
      }

      return null
    },
    [splitIndex, curveAdjustment, lineConfigs, dashPattern, lineDasharrays]
  )

  return [DasharrayCalculator, lineDasharrays]
}
