export type Bump = 'major' | 'minor' | 'patch'

export type Classification =
  | { bump: null; type: string | undefined; description: string }
  | { bump: 'patch'; type: 'fix' | 'perf' | 'revert'; description: string }
  | { bump: 'minor'; type: 'feat'; description: string }
  | { bump: 'major'; type: string; description: string }

export function classify(message: string): Classification {
  const subject = message.split('\n')[0] ?? ''
  const match = subject.match(/^([a-z]+)(?:\([^)]+\))?(!)?: (.+)$/)
  if (!match) return { bump: null, type: undefined, description: subject }
  const type = match[1] ?? ''
  const description = match[3] ?? ''
  // Uppercase footer only, per the conventional-commits spec; a lowercase
  // "breaking change" mention in prose is deliberately ignored.
  const body = message.slice(subject.length)
  if (match[2] || /^BREAKING[ -]CHANGE:/m.test(body)) {
    return { bump: 'major', type, description }
  }
  switch (type) {
    case 'feat':
      return { bump: 'minor', type, description }
    case 'fix':
    case 'perf':
    case 'revert':
      return { bump: 'patch', type, description }
    default:
      return { bump: null, type, description }
  }
}
