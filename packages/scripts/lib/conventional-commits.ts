export type Bump = 'major' | 'minor' | 'patch'

// The conventional parts of a commit subject (git's `%s`, the first line).
// `breaking` is the subject's `!` marker only — the `BREAKING CHANGE:` body
// footer is archaeology and is deliberately not consulted here.
export type ParsedSubject = {
  type: string | undefined
  breaking: boolean
  description: string
}

// A change's bump, derived from its type and breaking flag. A breaking change
// is always major; otherwise feat→minor, fix/perf/revert→patch, anything else
// (incl. unknown/config-driven types and undefined) does not bump.
export function bumpForType(
  type: string | undefined,
  breaking: boolean
): Bump | null {
  if (breaking) return 'major'
  switch (type) {
    case 'feat':
      return 'minor'
    case 'fix':
    case 'perf':
    case 'revert':
      return 'patch'
    default:
      return null
  }
}

export function parseSubject(subject: string): ParsedSubject {
  const firstLine = subject.split('\n')[0] ?? ''
  const match = firstLine.match(/^([a-z]+)(?:\([^)]+\))?(!)?: (.+)$/)
  if (!match) {
    return { type: undefined, breaking: false, description: firstLine }
  }
  return {
    type: match[1],
    breaking: Boolean(match[2]),
    description: match[3] ?? ''
  }
}

// Parse a full commit message (subject + body). Identical to `parseSubject`,
// but `breaking` also honours an uppercase `BREAKING CHANGE:`/`BREAKING-CHANGE:`
// footer per the Conventional Commits spec — so a break flagged only in the body
// (no subject `!`) is still detected. A lowercase mention in prose is ignored.
export function parseCommit(message: string): ParsedSubject {
  const subject = parseSubject(message)
  if (subject.breaking) return subject
  const firstLine = message.split('\n')[0] ?? ''
  const body = message.slice(firstLine.length)
  return { ...subject, breaking: /^BREAKING[ -]CHANGE:/m.test(body) }
}
