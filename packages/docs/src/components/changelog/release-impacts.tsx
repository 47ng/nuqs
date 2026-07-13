import type { CSSProperties } from 'react'
import { formatImpactLabel } from 'scripts/lib/changelog-dto'
import { FALLBACK_COLOR, LABEL_COLORS, labelTheme } from './label-colors'

// Both themes' AAA-compliant colors ride on the element as custom properties;
// github-label.css applies the right set per theme.
function labelColorVars(hex: string): CSSProperties {
  const light = labelTheme(hex, 'light')
  const dark = labelTheme(hex, 'dark')
  return {
    '--label-bg-light': light.bg,
    '--label-fg-light': light.fg,
    '--label-border-light': light.border,
    '--label-bg-dark': dark.bg,
    '--label-fg-dark': dark.fg,
    '--label-border-dark': dark.border
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
      {labels.map(label => {
        const color = LABEL_COLORS[label]
        if (color === undefined) {
          // Server component: lands in build logs, consistent with
          // buildReleaseModel's degrade-loudly convention.
          console.warn(
            'changelog: unmapped impact label %s — rendering raw name on a gray chip.',
            label
          )
        }
        return (
          <span
            key={label}
            className="github-label inline-flex items-center rounded-full px-2.5 text-xs leading-[22px] font-medium whitespace-nowrap"
            style={labelColorVars(color ?? FALLBACK_COLOR)}
          >
            {formatImpactLabel(label)}
          </span>
        )
      })}
    </div>
  )
}
