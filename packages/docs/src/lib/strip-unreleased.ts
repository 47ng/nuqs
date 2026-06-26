const OPEN_TAG = /^<SinceVersion\s+[^>]*?\bv=['"]([^'"]+)['"][^>]*>/
const CLOSE_TAG = '</SinceVersion>'

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
