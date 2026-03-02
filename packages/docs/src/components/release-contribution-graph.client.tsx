'use client'

import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphTotalCount,
  type Activity
} from '@/src/components/kibo-ui/contribution-graph'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/src/components/ui/tooltip'
import { cn } from '@/src/lib/utils'
import { useState } from 'react'
import type { ReleasesByDate } from './release-contribution-graph'

type ReleaseContributionGraphClientProps = {
  activities: Activity[]
  releasesByDate: ReleasesByDate
  stableCount: number
  betaCount: number
}

export function ReleaseContributionGraphClient({
  activities,
  releasesByDate,
  stableCount,
  betaCount
}: ReleaseContributionGraphClientProps) {
  const [highlightStable, setHighlightStable] = useState(true)
  const [highlightBeta, setHighlightBeta] = useState(false)
  return (
    <TooltipProvider>
      <ContributionGraph
        data={activities}
        maxLevel={2}
        blockSize={10}
        blockMargin={3}
        blockRadius={2}
        fontSize={12}
        labels={{
          totalCount: `${stableCount + betaCount} releases in {{year}}`
        }}
      >
        <ContributionGraphCalendar>
          {({ activity, dayIndex, weekIndex }) => {
            const versions = releasesByDate[activity.date]
            const block = (
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
            )
            if (!versions) {
              return block
            }
            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  <g>{block}</g>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{activity.date}</p>
                  <ul>
                    {versions.map(v => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            )
          }}
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
    </TooltipProvider>
  )
}
