const OPEN_TAG = /^<SinceVersion\s+[^>]*?\bv=['"]([^'"]+)['"][^>]*>/
const CLOSE_TAG = '</SinceVersion>'
const HEADING = /^#{1,6}\s+(.*)$/
const EXPLICIT_ID = /\[#([^\]]+)\]\s*$/

/**
 * Applies `<SinceVersion>` gating to the Markdown source of the LLM outputs,
 * the text-layer counterpart to the `SinceVersion` React component.
 *
 * Hidden blocks (those whose version `isVisible` rejects) are removed along with
 * their content; visible blocks are unwrapped, keeping the content and dropping
 * only the wrapper tags. Tags inside fenced code blocks are left untouched, and
 * nesting is handled — a block nested inside a hidden one stays hidden.
 */
export function stripUnreleased(
  markdown: string,
  isVisible: (version: string) => boolean
): string {
  const output: string[] = []
  let inFence = false
  let depth = 0 // number of open <SinceVersion> wrappers
  let hiddenFrom = -1 // depth at which the outermost hidden block began, or -1

  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) {
      inFence = !inFence
    }

    if (!inFence) {
      const open = line.trimStart().match(OPEN_TAG)
      if (open) {
        depth++
        if (hiddenFrom === -1 && !isVisible(open[1]!)) {
          hiddenFrom = depth
        }
        continue
      }
      if (line.trimStart().startsWith(CLOSE_TAG)) {
        if (depth === hiddenFrom) {
          hiddenFrom = -1
        }
        depth = Math.max(0, depth - 1)
        continue
      }
    }

    if (hiddenFrom === -1) {
      output.push(line)
    }
  }

  return output.join('\n')
}

/**
 * Collects the heading ids that live inside hidden `<SinceVersion>` blocks, so
 * the page can prune them from the table of contents — fumadocs extracts the ToC
 * from the raw headings at build time, bypassing the `SinceVersion` runtime gate.
 *
 * Ids come from an explicit `[#id]` when present (matching the ToC anchors), and
 * otherwise from a slug of the heading text. Shares the fence/nesting-aware walk
 * of `stripUnreleased`, so the two surfaces gate identically.
 */
export function gatedHeadingIds(
  markdown: string,
  isVisible: (version: string) => boolean
): Set<string> {
  const ids = new Set<string>()
  let inFence = false
  let depth = 0
  let hiddenFrom = -1

  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) {
      continue
    }

    const open = line.trimStart().match(OPEN_TAG)
    if (open) {
      depth++
      if (hiddenFrom === -1 && !isVisible(open[1]!)) {
        hiddenFrom = depth
      }
      continue
    }
    if (line.trimStart().startsWith(CLOSE_TAG)) {
      if (depth === hiddenFrom) {
        hiddenFrom = -1
      }
      depth = Math.max(0, depth - 1)
      continue
    }

    if (hiddenFrom !== -1) {
      const heading = line.match(HEADING)
      if (heading) {
        ids.add(headingId(heading[1]!))
      }
    }
  }

  return ids
}

/**
 * Resolves a heading line to its ToC id. Gated headings carry an explicit
 * `[#id]` (matching the anchor fumadocs emits); the slug is a best-effort
 * fallback for plain-text headings without one.
 */
function headingId(headingText: string): string {
  return headingText.match(EXPLICIT_ID)?.[1] ?? slugify(headingText)
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
