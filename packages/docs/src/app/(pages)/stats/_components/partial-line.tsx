'use client'

import { Line, LineProps, usePlotArea, useYAxisDomain } from 'recharts'

const Y_AXIS_TICK_COUNT = 5
const Y_AXIS_STEP_COUNT = Y_AXIS_TICK_COUNT * 2

function map(
  input: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  return ((input - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function tickStep(start: number, stop: number, count: number) {
  const span = Math.abs(stop - start)
  if (span === 0 || !Number.isFinite(span)) return 0
  const step0 = span / Math.max(1, count)
  const power = Math.floor(Math.log10(step0))
  const error = step0 / Math.pow(10, power)
  let step = 1
  if (error >= Math.sqrt(50)) {
    step = 10
  } else if (error >= Math.sqrt(10)) {
    step = 5
  } else if (error >= Math.sqrt(2)) {
    step = 2
  }
  return step * Math.pow(10, power)
}

function niceTickMax(min: number, max: number, ticks: number) {
  if (ticks <= 0) return max
  const step = tickStep(min, max, ticks)
  if (step === 0) return max
  return Math.ceil(max / step) * step
}

function getMonotoneSlopes(points: Point[]) {
  const count = points.length
  if (count < 2) return []
  const deltas = new Array<number>(count - 1)
  for (let i = 0; i < count - 1; i++) {
    const dx = points[i + 1].x - points[i].x
    deltas[i] = dx === 0 ? 0 : (points[i + 1].y - points[i].y) / dx
  }
  const slopes = new Array<number>(count)
  slopes[0] = deltas[0]
  slopes[count - 1] = deltas[count - 2]
  for (let i = 1; i < count - 1; i++) {
    if (
      deltas[i - 1] === 0 ||
      deltas[i] === 0 ||
      deltas[i - 1] * deltas[i] < 0
    ) {
      slopes[i] = 0
    } else {
      slopes[i] = (deltas[i - 1] + deltas[i]) / 2
    }
  }
  for (let i = 0; i < count - 1; i++) {
    const delta = deltas[i]
    if (delta === 0) {
      slopes[i] = 0
      slopes[i + 1] = 0
      continue
    }
    const a = slopes[i] / delta
    const b = slopes[i + 1] / delta
    if (a < 0 || b < 0) {
      slopes[i] = 0
      slopes[i + 1] = 0
      continue
    }
    const magnitude = a * a + b * b
    if (magnitude > 9) {
      const scale = 3 / Math.sqrt(magnitude)
      slopes[i] = scale * a * delta
      slopes[i + 1] = scale * b * delta
    }
  }
  return slopes
}

function getMonotoneSegmentPoint(
  start: Point,
  end: Point,
  startSlope: number,
  endSlope: number,
  t: number
) {
  const dx = end.x - start.x
  const t2 = t * t
  const t3 = t2 * t
  const h00 = 2 * t3 - 3 * t2 + 1
  const h10 = t3 - 2 * t2 + t
  const h01 = -2 * t3 + 3 * t2
  const h11 = t3 - t2
  const x = start.x + dx * t
  const y =
    h00 * start.y + h10 * dx * startSlope + h01 * end.y + h11 * dx * endSlope
  return { x, y }
}

function getMonotoneSegmentLength(
  start: Point,
  end: Point,
  startSlope: number,
  endSlope: number
) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const chord = Math.sqrt(dx * dx + dy * dy)
  if (chord === 0) return 0
  const samples = clamp(Math.round(chord / 12), 4, 12)
  let length = 0
  let previous = start
  for (let i = 1; i <= samples; i++) {
    const point = getMonotoneSegmentPoint(
      start,
      end,
      startSlope,
      endSlope,
      i / samples
    )
    const deltaX = point.x - previous.x
    const deltaY = point.y - previous.y
    length += Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    previous = point
  }
  return length
}

function getMonotoneLengths(points: Point[], slopes: number[]) {
  if (points.length < 2) return { total: 0, last: 0 }
  let total = 0
  let last = 0
  for (let i = 0; i < points.length - 1; i++) {
    const segmentLength = getMonotoneSegmentLength(
      points[i],
      points[i + 1],
      slopes[i],
      slopes[i + 1]
    )
    total += segmentLength
    if (i === points.length - 2) {
      last = segmentLength
    }
  }
  return { total, last }
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

type Point = { x: number; y: number }
type Tangent = { x: number; y: number }

function getDashArray(solidLength: number, dashedLength: number) {
  const targetDashPattern = [2, 2]
  const patternSegmentLength =
    (targetDashPattern?.[0] || 0) + (targetDashPattern?.[1] || 0) || 1
  const repetitions = Math.ceil(dashedLength / patternSegmentLength)
  const dashedPatternSegments = Array.from({ length: repetitions }, () =>
    targetDashPattern.join(' ')
  )

  const finalDasharray = `${solidLength} ${dashedPatternSegments.join(' ')}`

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
  const maxY = niceTickMax(minY, Number(yAxisDomain[1]), Y_AXIS_STEP_COUNT)
  const stepX = (area.width - (p.l + p.r)) / (data.length - 1)
  const coordinates = data.map((d, i) => {
    const x = area.x + p.l + i * stepX
    const y = map(d, minY, maxY, area.y + area.height, area.y)
    return { x, y }
  })
  const slopes = getMonotoneSlopes(coordinates)
  const { total, last } = getMonotoneLengths(coordinates, slopes)
  const solidLength = total - last
  return getDashArray(solidLength, last)
}

function useDebugPoints({
  data,
  padding = {},
  enabled
}: Pick<UseStrokeDashArrayProps, 'data' | 'padding'> & { enabled: boolean }) {
  const area = usePlotArea()
  const yAxisDomain = useYAxisDomain()
  if (!enabled || !area || !yAxisDomain) return null
  const p = {
    t: padding.top ?? 0,
    r: padding.right ?? 0,
    b: padding.bottom ?? 0,
    l: padding.left ?? 0
  }
  const minY = Number(yAxisDomain[0])
  const maxY = niceTickMax(minY, Number(yAxisDomain[1]), Y_AXIS_STEP_COUNT)
  const stepX = (area.width - (p.l + p.r)) / (data.length - 1)
  const points = data.map((d, i) => {
    const x = area.x + p.l + i * stepX
    const y = map(d, minY, maxY, area.y + area.height, area.y)
    return { x, y }
  })
  const slopes = getMonotoneSlopes(points)
  return { points, slopes, enabled }
}

function DebugOverlay({ points, slopes }: DebugPoints) {
  const tangentScale = 10
  return (
    <g className="pointer-events-none">
      {points.map((point, index) => (
        <circle
          key={`point-${index}`}
          cx={point.x}
          cy={point.y}
          r={2}
          fill="var(--color-amber-500)"
        />
      ))}
      {points.map((point, index) => {
        const slope = slopes[index] ?? 0
        const dx = tangentScale
        const dy = slope * dx
        return (
          <line
            key={`tangent-${index}`}
            x1={point.x - dx}
            y1={point.y - dy}
            x2={point.x + dx}
            y2={point.y + dy}
            stroke="var(--color-amber-500)"
            strokeWidth={1}
            strokeOpacity={0.7}
          />
        )
      })}
    </g>
  )
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
  showDebug?: boolean
}

type DebugPoints = {
  points: Point[]
  slopes: number[]
  enabled: boolean
}

export function PartialLine({
  data,
  partialLast,
  showDebug,
  ...props
}: PartialLineProps) {
  if (!partialLast && !showDebug) {
    // Avoid computing dasharray & debug points if not needed
    // We need to not pass data to this component, hence why it's spread out of props.
    return <Line {...props} />
  }
  return (
    <PartialLineImpl
      data={data}
      partialLast={partialLast}
      showDebug={showDebug}
      {...props}
    />
  )
}

function PartialLineImpl({
  data,
  partialLast,
  padding = {},
  showDebug = false,
  ...props
}: PartialLineProps) {
  const strokeDasharray = useStrokeDashArray({
    data,
    partialLast,
    padding
  })
  const debugPoints = useDebugPoints({ data, padding, enabled: showDebug })
  return (
    <>
      <Line strokeDasharray={strokeDasharray} {...props} />
      {showDebug && debugPoints ? <DebugOverlay {...debugPoints} /> : null}
    </>
  )
}
