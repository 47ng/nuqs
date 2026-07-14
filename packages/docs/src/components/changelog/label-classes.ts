import type { KnownImpactLabel } from 'scripts/lib/changelog-dto'

// Tailwind classes for each impact label badge, hue-matched to the GitHub
// label colors of the 47ng/nuqs repo (refresh against `gh label list` if
// those change). Contrast is a review/test concern, not a runtime one: stick
// to the *-50/*-900 band in light and *-950/*-200 in dark. Monochrome brands
// (Next.js/Vercel are strictly black & white) get no fill at all.

const green =
  'border-green-600/50 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-200'
const monochrome = 'border-foreground/40 bg-transparent text-foreground'
const indigo =
  'border-indigo-600/50 bg-indigo-50 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200'
const cyan =
  'border-cyan-600/50 bg-cyan-50 text-cyan-900 dark:border-cyan-700 dark:bg-cyan-950 dark:text-cyan-200'
const red =
  'border-red-600/50 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200'
const fuchsia =
  'border-fuchsia-600/50 bg-fuchsia-50 text-fuchsia-900 dark:border-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-200'
const emerald =
  'border-emerald-600/50 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
const amber =
  'border-amber-600/50 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200'
const gray =
  'border-zinc-600/50 bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200'

export const LABEL_CLASSES: Record<KnownImpactLabel, string> = {
  'feature/useQueryState': green,
  'feature/useQueryStates': green,
  'feature/serializer': green,
  'feature/cache': green,
  'feature/time-safety': green,
  'parsers/built-in': monochrome,
  'parsers/community': indigo,
  'adapters/next/app': monochrome,
  'adapters/next/pages': monochrome,
  'adapters/react': cyan,
  'adapters/react-router': red,
  'adapters/remix': fuchsia,
  'adapters/tanstack-router': emerald,
  'adapters/testing': amber,
  'adapters/community': gray
}
