import { cn } from '@/src/lib/utils'
import { TriangleAlert } from 'lucide-react'
import type { ComponentProps } from 'react'

// Inline accessible marker rendered beside a changelog line whose DTO `breaking`
// flag is set. A real icon carrying an `aria-label` (not an emoji), so assistive
// tech announces it as "Breaking change". There is deliberately no standalone
// "Breaking changes" section on the page — that narrative role belongs to the
// preamble; this marker only flags the individual change within its category
// section. Shared by both line variants (`PullRequestLine`, `CommitLine`) so the
// label and styling can't drift between them.
export function BreakingChangeMarker({
  className,
  ...props
}: Omit<ComponentProps<typeof TriangleAlert>, 'aria-label' | 'role'>) {
  return (
    <TriangleAlert
      role="img"
      aria-label="Breaking change"
      className={cn('inline h-4 w-4 text-amber-500', className)}
      {...props}
    />
  )
}
