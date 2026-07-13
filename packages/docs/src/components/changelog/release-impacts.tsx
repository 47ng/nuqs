import type { CSSProperties } from 'react'
import { formatImpactLabel } from 'scripts/lib/changelog-dto'

// The GitHub label colors of the impact labels, as configured on the repo.
// Presentation-only (the notes markdown can't carry color), so the map lives
// here rather than in the shared codec; an unmapped label falls back to the
// neutral gray of `adapters/community`.
const LABEL_COLORS: Record<string, string> = {
  'feature/useQueryState': '#c6f6d5',
  'feature/useQueryStates': '#c6f6d5',
  'feature/serializer': '#c6f6d5',
  'feature/cache': '#c6f6d5',
  'feature/time-safety': '#c6f6d5',
  'parsers/built-in': '#ffffff',
  'parsers/community': '#4a45e4',
  'adapters/next/app': '#000000',
  'adapters/next/pages': '#000000',
  'adapters/react': '#5fdbfb',
  'adapters/react-router': '#f44250',
  'adapters/remix': '#c15baf',
  'adapters/tanstack-router': '#36af4d',
  'adapters/testing': '#fcc72b',
  'adapters/community': '#888888'
}
const FALLBACK_COLOR = '#888888'

// The custom properties GitHub's label formula reads (see github-label.css):
// the raw RGB channels plus the HSL decomposition of the same color.
function labelColorVars(hex: string): CSSProperties {
  const value = parseInt(hex.slice(1), 16)
  const r = (value >> 16) & 0xff
  const g = (value >> 8) & 0xff
  const b = value & 0xff
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
  let h = 0
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6
    else if (max === gn) h = (bn - rn) / delta + 2
    else h = (rn - gn) / delta + 4
    h = (h * 60 + 360) % 360
  }
  return {
    '--label-r': r,
    '--label-g': g,
    '--label-b': b,
    '--label-h': Math.round(h),
    '--label-s': Math.round(s * 100),
    '--label-l': Math.round(l * 100)
  } as CSSProperties
}

export type ReleaseImpactsProps = {
  labels: readonly string[]
}

// Per-release impacts row, built entirely from the DTO's per-change labels —
// zero GitHub API calls. Releases published before labels were captured carry
// none and render nothing.
export function ReleaseImpacts({ labels }: ReleaseImpactsProps) {
  if (labels.length === 0) return null
  return (
    <div className="not-prose mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
      <span className="text-fd-muted-foreground text-sm">Impacts</span>
      {labels.map(label => (
        <span
          key={label}
          className="github-label inline-flex items-center rounded-full px-2.5 text-xs leading-[22px] font-medium whitespace-nowrap"
          style={labelColorVars(LABEL_COLORS[label] ?? FALLBACK_COLOR)}
        >
          {formatImpactLabel(label)}
        </span>
      ))}
    </div>
  )
}
