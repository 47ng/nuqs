#!/usr/bin/env node

// Gate for the release-edited ISR bust: runs the shared codec against
// $RELEASE_BODY (env, never an argument — a hostile body is only ever parser
// data, never shell input) and signals the result through three exit codes so a
// codec regression can't masquerade as an expected "no DTO":
//   0 — a valid DTO (bust the cache)
//   1 — expected: no DTO present (skip busting)
//   2 - an invalid DTO: the caller should fail the job loud
//   3 - the codec threw (import/regression): the caller should fail the job loud

try {
  const { parseChangelogComment } = await import('./lib/changelog-dto.ts')
  const result = parseChangelogComment(process.env.RELEASE_BODY ?? null)
  if (result.status === 'ok') {
    console.log('Release body carries a valid changelog DTO.')
    process.exit(0)
  }
  if (result.status === 'invalid') {
    console.error(
      `Release body carries an INVALID changelog DTO: ${result.reason}`
    )
    process.exit(2)
  }
  console.info('No changelog DTO found in the release body')
  process.exit(1)
} catch (error) {
  console.error('validate-changelog-dto crashed (codec regression?):', error)
  process.exit(3)
}
