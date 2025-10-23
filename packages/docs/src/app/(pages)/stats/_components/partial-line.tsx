'use client'

import { Line, LineProps, usePlotArea, useYAxisDomain } from 'recharts'

function map(
  input: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  return ((input - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

function roundCeil(num: number) {
  // Eg: for  1234 ->  1500
  //     for 67890 -> 70000
  const magnitude = Math.pow(10, Math.floor(Math.log10(num)))
  return Math.ceil(num / magnitude) * magnitude
}

function getLineLength(points: { x: number; y: number }[]) {
  let length = 0
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x
    const dy = points[i].y - points[i - 1].y
    length += Math.sqrt(dx * dx + dy * dy)
  }
  return length
}

type UseStrokeDashArrayProps = {
  data: number[]
  partialLast: boolean
  padding?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

function getDashArray(solidLength: number, dashedLength: number) {
  const curveCorrectionFactor = 1
  const adjustment = (solidLength * curveCorrectionFactor) / 100
  const solidDasharrayPart = solidLength + adjustment

  const targetDashPattern = [5, 3]
  const patternSegmentLength =
    (targetDashPattern?.[0] || 0) + (targetDashPattern?.[1] || 0) || 1
  const repetitions = Math.ceil(dashedLength / patternSegmentLength)
  const dashedPatternSegments = Array.from({ length: repetitions }, () =>
    targetDashPattern.join(' ')
  )

  const finalDasharray = `${solidDasharrayPart} ${dashedPatternSegments.join(
    ' '
  )}`

  return finalDasharray
}

function useStrokeDashArray({
  data,
  partialLast,
  padding = {}
}: UseStrokeDashArrayProps) {
  const area = usePlotArea()
  const yAxisDomain = useYAxisDomain()
  if (!partialLast || !area || !yAxisDomain) return undefined
  const p = {
    t: padding.top ?? 0,
    r: padding.right ?? 0,
    b: padding.bottom ?? 0,
    l: padding.left ?? 0
  }
  const minY = Number(yAxisDomain[0])
  // note: yAxisDomain[1] is the data max, not the tick max,
  // so we round it up to the nearest "nice" number for a correct mapping
  // See https://github.com/recharts/recharts/issues/6350
  const maxY = roundCeil(Number(yAxisDomain[1]))
  const stepX = (area.width - (p.l + p.r)) / (data.length - 1)
  const coordinates = data.map((d, i) => {
    const x = area.x + p.l + i * stepX
    const y = map(d, minY, maxY, area.y + area.height, area.y)
    return { x, y }
  })
  const totalLength = getLineLength(coordinates)
  const dashedLength = getLineLength(coordinates.slice(-2))
  const solidLength = totalLength - dashedLength
  return getDashArray(solidLength, dashedLength)
}

type PartialLineProps = LineProps & {
  data: number[]
  partialLast: boolean
  padding?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

export function PartialLine({
  data,
  partialLast,
  padding = {},
  ...props
}: PartialLineProps) {
  const strokeDasharray = useStrokeDashArray({
    data,
    partialLast,
    padding
  })
  return <Line strokeDasharray={strokeDasharray} {...props} />
}
