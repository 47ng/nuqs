import { cn } from '@/src/lib/utils'
import { Callout } from 'fumadocs-ui/components/callout'
import { CheckCircle, XCircle } from 'lucide-react'
import { FRAMEWORK_ICONS, FRAMEWORKS, type Frameworks } from './frameworks'
import {
  TooltipPopover,
  TooltipPopoverContent,
  TooltipPopoverTrigger
} from './ui/tooltip-popover'

export type FeatureSupportMatrixProps = {
  introducedInVersion: string
  deprecatedInVersion?: string
  hideFrameworks?: boolean
  support?: Support
}

type Support = {
  supported: boolean
  frameworks: 'all' | Frameworks[]
}

export function FeatureSupportMatrix({
  introducedInVersion,
  deprecatedInVersion,
  hideFrameworks = false,
  support = { supported: true, frameworks: 'all' }
}: FeatureSupportMatrixProps) {
  const supportedIn = support.supported
    ? resolveFrameworks(support.frameworks)
    : FRAMEWORKS.filter(fw => support.frameworks.includes(fw) === false)
  const notSupportedIn = FRAMEWORKS.filter(
    fw => supportedIn.includes(fw) === false
  )
  return (
    <Callout
      type={deprecatedInVersion ? 'warning' : 'success'}
      className="pr-1"
    >
      <div className="flex flex-wrap gap-4">
        <span className="text-balance">
          Introduced in version <strong>{introducedInVersion}</strong>
          {deprecatedInVersion ? (
            <>
              , and deprecated in version <strong>{deprecatedInVersion}</strong>
            </>
          ) : (
            '.'
          )}
        </span>
        {!hideFrameworks && (
          <div className="not-prose ml-auto flex items-center gap-1 text-xl">
            <TooltipPopover delayDuration={100}>
              <TooltipPopoverTrigger
                className={cn(
                  '-my-2 flex flex-shrink-0 items-center gap-2 rounded-lg py-2 pr-2.5 pl-2',
                  // Outline variant
                  'bg-green-50/25 outline -outline-offset-1 outline-green-500/25 dark:bg-green-950/30 dark:outline-green-500/10'
                )}
              >
                {dedupeFrameworks(supportedIn).map(framework => {
                  const Icon = FRAMEWORK_ICONS[framework]
                  return (
                    <span
                      key={framework}
                      className="pointer-events-none flex-shrink-0 select-none"
                    >
                      <Icon />
                    </span>
                  )
                })}
                <CheckCircle
                  size={16}
                  className="flex-shrink-0 stroke-[2.25] text-green-500"
                  role="presentation"
                />
              </TooltipPopoverTrigger>
              <TooltipPopoverContent className="py-2 text-xs">
                {supportedIn.length === FRAMEWORKS.length ? (
                  'This feature is supported in all frameworks.'
                ) : supportedIn.length === 1 ? (
                  <>Only supported in {supportedIn[0]}.</>
                ) : (
                  <>
                    Supported frameworks:
                    <ul className="mt-1 ml-3 list-disc">
                      {supportedIn.map(fw => (
                        <li key={fw}>{fw}</li>
                      ))}
                    </ul>
                  </>
                )}
              </TooltipPopoverContent>
            </TooltipPopover>
            {notSupportedIn.length > 0 && (
              <TooltipPopover delayDuration={100}>
                <TooltipPopoverTrigger
                  className={cn(
                    '-my-2 flex flex-shrink-0 items-center gap-2 rounded-lg py-2 pr-2.5 pl-2',
                    // Gray-out effect
                    'opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 focus:opacity-100 focus:grayscale-0 data-[state=open]:opacity-100 data-[state=open]:grayscale-0',
                    // Outline variant
                    'bg-amber-50/25 outline -outline-offset-1 outline-amber-500/25 dark:bg-amber-950/30 dark:outline-amber-500/10'
                  )}
                >
                  {dedupeFrameworks(notSupportedIn).map(framework => {
                    const Icon = FRAMEWORK_ICONS[framework]
                    return (
                      <span
                        key={framework}
                        className="pointer-events-none flex-shrink-0 select-none"
                      >
                        <Icon />
                      </span>
                    )
                  })}
                  <XCircle
                    size={18}
                    className="flex-shrink-0 stroke-2 text-amber-500"
                    role="presentation"
                  />
                </TooltipPopoverTrigger>
                <TooltipPopoverContent className="py-2 text-xs">
                  {notSupportedIn.length === 1 ? (
                    <>Not supported in {notSupportedIn[0]}.</>
                  ) : (
                    <>
                      Not supported in:
                      <ul className="mt-1 ml-3 list-disc">
                        {notSupportedIn.map(fw => (
                          <li key={fw}>{fw}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </TooltipPopoverContent>
              </TooltipPopover>
            )}
          </div>
        )}
      </div>
    </Callout>
  )
}

function dedupeFrameworks(frameworks: readonly Frameworks[]) {
  // If both Next.js app router and pages router are included, only keep Next.js app router
  if (
    frameworks.includes('Next.js (app router)') &&
    frameworks.includes('Next.js (pages router)')
  ) {
    frameworks = frameworks.filter(fw => fw !== 'Next.js (pages router)')
  }
  return frameworks
}

function resolveFrameworks(
  frameworks: 'all' | Frameworks[]
): readonly Frameworks[] {
  if (frameworks === 'all') {
    return FRAMEWORKS
  }
  return frameworks
}
