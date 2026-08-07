export type Bump = 'major' | 'minor' | 'patch'

// The conventional parts of a commit's `type(scope)?(!)?: description`. How
// `breaking` is populated depends on the parser: `parseSubject` reads only the
// subject `!`, while `parseCommit` also honours a `BREAKING CHANGE:` body footer.
// `parseCommit` can therefore reach `{ type: undefined, breaking: true }` (a
// footer-only break with a non-conventional subject) — a legal, desirable state
// that still forces a major bump.
export type ParsedSubject = {
  readonly type: string | undefined
  readonly breaking: boolean
  readonly description: string
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

// Parse a commit subject (first line) into its conventional parts. `breaking`
// reflects only the subject's `!` marker; the body footer is `parseCommit`'s
// concern. Used for the prose title strip, where there is no body to consult.
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
