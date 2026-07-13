import { Badge } from '@/src/components/ui/badge'
import { formatImpactLabel } from 'scripts/lib/changelog-dto'

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
        <Badge key={label} variant="secondary" className="font-medium">
          {formatImpactLabel(label)}
        </Badge>
      ))}
    </div>
  )
}
