'use client'

import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphTotalCount,
  type Activity
} from '@/src/components/kibo-ui/contribution-graph'
import { cn } from '@/src/lib/utils'
import { useState } from 'react'

type ReleaseContributionGraphClientProps = {
  year: number
  activities: Activity[]
  stableCount: number
  betaCount: number
}

export function ReleaseContributionGraphClient({
  year,
  activities,
  stableCount,
  betaCount
}: ReleaseContributionGraphClientProps) {
  const [highlightStable, setHighlightStable] = useState(true)
  const [highlightBeta, setHighlightBeta] = useState(false)
  return (
    <ContributionGraph
      data={activities}
      maxLevel={2}
      blockSize={10}
      blockMargin={3}
      blockRadius={2}
      fontSize={12}
      labels={{
        totalCount: `${stableCount + betaCount} releases in ${year}`
      }}
    >
      <ContributionGraphCalendar>
        {({ activity, dayIndex, weekIndex }) => (
          <ContributionGraphBlock
            activity={activity}
            dayIndex={dayIndex}
            weekIndex={weekIndex}
            className={cn(
              'data-[level="0"]:fill-muted',
              highlightBeta
                ? 'data-[level="1"]:fill-amber-500 dark:data-[level="1"]:fill-amber-400'
                : 'data-[level="1"]:fill-muted-foreground/60',
              highlightStable
                ? 'data-[level="2"]:fill-green-500 dark:data-[level="2"]:fill-green-400'
                : 'data-[level="2"]:fill-foreground/80'
            )}
          />
        )}
      </ContributionGraphCalendar>
      <ContributionGraphFooter>
        <ContributionGraphTotalCount />
        <div className="text-muted-foreground ml-auto flex items-center gap-4">
          <button
            aria-label="Toggle highlight stable releases"
            className="flex cursor-pointer items-center gap-1.5"
            onClick={() => setHighlightStable(x => !x)}
          >
            <div
              className={cn(
                'h-3 w-3 rounded-sm',
                highlightStable
                  ? 'bg-green-500 dark:bg-green-400'
                  : 'bg-foreground/80'
              )}
            />
            <span>Stable ({stableCount})</span>
          </button>
          <button
            aria-label="Toggle highlight beta releases"
            className="flex cursor-pointer items-center gap-1.5"
            onClick={() => setHighlightBeta(x => !x)}
          >
            <div
              className={cn(
                'h-3 w-3 rounded-sm',
                highlightBeta
                  ? 'bg-amber-500 dark:bg-amber-400'
                  : 'bg-muted-foreground/60'
              )}
            />
            <span>Beta ({betaCount})</span>
          </button>
        </div>
      </ContributionGraphFooter>
    </ContributionGraph>
  )
}
