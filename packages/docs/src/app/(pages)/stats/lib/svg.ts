// Source:
// https://medium.com/@francoisromain/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74

export type Point = [number, number]

export type CommandFn = (point: Point, index: number, array: Point[]) => string

const FLOAT_DECIMALS = 4

export function svgPath(points: Point[], command: CommandFn) {
  // build the d attributes by looping over the points
  const d = points.reduce(
    (acc, point, i, a) =>
      i === 0 // if first point
        ? `M ${point[0].toFixed(FLOAT_DECIMALS)},${point[1].toFixed(
            FLOAT_DECIMALS
          )}` // else
        : `${acc} ${command([point[0], point[1]], i, a)}`,
    ''
  )
  return d
}
export const lineCommand = (point: Point) => `L ${point[0]} ${point[1]}`

const line = (pointA: Point, pointB: Point) => {
  const lengthX = pointB[0] - pointA[0]
  const lengthY = pointB[1] - pointA[1]
  return {
    length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
    angle: Math.atan2(lengthY, lengthX)
  }
}

function controlPoint(
  current: Point,
  previous: Point,
  next: Point,
  reverse?: boolean
) {
  // When 'current' is the first or last point of the array
  // 'previous' or 'next' don't exist.
  // Replace with 'current'
  const p = previous || current
  const n = next || current // The smoothing ratio
  const smoothing = 0.2 // Properties of the opposed-line
  const o = line(p, n) // If is end-control-point, add PI to the angle to go backward
  const angle = o.angle + (reverse ? Math.PI : 0)
  const length = o.length * smoothing // The control point position is relative to the current point
  const x = current[0] + Math.cos(angle) * length
  const y = current[1] + Math.sin(angle) * length
  return [x, y]
}

export const bezierCommand: CommandFn = (point, i, a) => {
  // start control point
  const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point) // end control point
  const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true)
  const coordinates = (x: number, y: number) =>
    [x.toFixed(FLOAT_DECIMALS), y.toFixed(FLOAT_DECIMALS)].join(',')
  return [
    'C',
    coordinates(cpsX, cpsY),
    coordinates(cpeX, cpeY),
    coordinates(point[0], point[1])
  ].join(' ')
}
