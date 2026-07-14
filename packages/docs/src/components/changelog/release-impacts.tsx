import { Badge } from '@/src/components/ui/badge'
import { cn } from '@/src/lib/utils'
import {
  formatImpactLabel,
  type KnownImpactLabel
} from 'scripts/lib/changelog-dto'
import { LABEL_CLASSES } from './label-classes'

export type ReleaseImpactsProps = {
  labels: readonly KnownImpactLabel[]
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
        <Badge
          key={label}
          variant="outline"
          className={cn('whitespace-nowrap', LABEL_CLASSES[label])}
        >
          {formatImpactLabel(label)}
        </Badge>
      ))}
    </div>
  )
}
