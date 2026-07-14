import { Badge } from '@/src/components/ui/badge'
import { cn } from '@/src/lib/utils'
import {
  formatImpactLabel,
  isKnownImpactLabel
} from 'scripts/lib/changelog-dto'
import { FALLBACK_CLASSES, LABEL_CLASSES } from './label-classes'

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
        const classes = isKnownImpactLabel(label)
          ? LABEL_CLASSES[label]
          : undefined
        if (classes === undefined) {
          // Server component: lands in build logs, consistent with
          // buildReleaseModel's degrade-loudly convention.
          console.warn(
            'changelog: unmapped impact label %s — rendering raw name on a gray badge.',
            label
          )
        }
        return (
          <Badge
            key={label}
            variant="outline"
            className={cn('whitespace-nowrap', classes ?? FALLBACK_CLASSES)}
          >
            {formatImpactLabel(label)}
          </Badge>
        )
      })}
    </div>
  )
}
