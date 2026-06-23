import { describe, expect, it } from 'vitest'
import { bumpHeadings } from './_lib.ts'

describe('bumpHeadings', () => {
  it('bumps every ATX heading one level deeper', () => {
    expect(bumpHeadings('# Title\n## Features\n### Detail')).toBe(
      '## Title\n### Features\n#### Detail'
    )
  })

  it('leaves non-heading lines untouched', () => {
    expect(bumpHeadings('a line\n#tag-no-space\nmore')).toBe(
      'a line\n#tag-no-space\nmore'
    )
  })

  it('does not bump a # line inside a fenced code block', () => {
    const body = [
      '## Features',
      '',
      '```sh',
      '# install',
      'pnpm add nuqs',
      '```'
    ].join('\n')
    expect(bumpHeadings(body)).toBe(
      ['### Features', '', '```sh', '# install', 'pnpm add nuqs', '```'].join(
        '\n'
      )
    )
  })

  it('handles ~~~ fences too', () => {
    const body = [
      '# Heading',
      '~~~',
      '# not a heading',
      '~~~',
      '## After'
    ].join('\n')
    expect(bumpHeadings(body)).toBe(
      ['## Heading', '~~~', '# not a heading', '~~~', '### After'].join('\n')
    )
  })
})
