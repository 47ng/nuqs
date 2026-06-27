import { getPublishedVersion, isReleased } from '@/src/lib/published-version'
import type { ReactNode } from 'react'

type SinceVersionProps = {
  v: string
  /**
   * How the preview cue is rendered. `block` (default) wraps the content in a
   * dashed-border fieldset; `inline` renders a `::after` pseudo-element instead,
   * for gating a single item without breaking its host list.
   */
  disclaimer?: 'block' | 'inline'
  children?: ReactNode
}

/**
 * Gates documentation for a feature introduced in nuqs version `v`.
 *
 * - In production the content renders only once `v` has shipped to the published
 *   GA; before that it is hidden.
 * - On preview & local deployments everything renders with a cue marking what
 *   won't be live in production yet: a dashed-border fieldset for `block`
 *   gates, or an inline `::after` note for `inline` gates.
 *
 * The LLM outputs are gated separately at the Markdown layer (see
 * `stripUnreleased`), so this component only governs the HTML docs.
 */
export async function SinceVersion({
  v,
  disclaimer = 'block',
  children
}: SinceVersionProps) {
  const published = await getPublishedVersion()
  const released = isReleased(v, published)
  const isPreview = process.env.VERCEL_ENV !== 'production'

  if (released) {
    if (isPreview) {
      warnStaleGate(v, published)
    }
    return <>{children}</>
  }

  // Unreleased in production: hide it. An inline gate renders a marker so its
  // host <li> can be collapsed via CSS — a list item emptied by a null child
  // keeps whitespace/comment nodes, so it is not `:empty`. A block gate just
  // renders nothing.
  if (!isPreview) {
    return disclaimer === 'inline' ? (
      <span className="nuqs-gated-empty" hidden />
    ) : null
  }

  // Preview & local: show the unreleased content with a cue. The inline cue is a
  // ::after pseudo-element (see tweaks.css) so it never fragments a host list.
  if (disclaimer === 'inline') {
    return (
      <span className="nuqs-since-version" data-since={v}>
        {children}
      </span>
    )
  }

  return (
    <fieldset className="my-4 rounded-xl border border-dashed border-amber-400/60 px-4 pb-1 dark:border-amber-600">
      <legend className="not-prose px-2 text-sm text-amber-500">
        🏗️ Visible from <code className="text-xs">nuqs@{v}</code> 🏗️
      </legend>
      {children}
    </fieldset>
  )
}

const warnedStaleGates = new Set<string>()

/**
 * Nudge (preview & local only, deduped per version) when a gate has shipped and
 * is now a no-op, so it can be cleaned up. Reached only on the non-production
 * passthrough branch above.
 */
function warnStaleGate(v: string, published: string) {
  if (warnedStaleGates.has(v)) {
    return
  }
  warnedStaleGates.add(v)
  console.warn(
    `[SinceVersion] nuqs@${v} has shipped (latest: ${published}). This gate is ` +
      `now a no-op: search the docs content for <SinceVersion v="${v}"> and ` +
      `remove each wrapper, keeping its inner content.`
  )
}
