import { describe, expect, it } from 'vitest'
import { gatedHeadingIds, stripUnreleased } from './strip-unreleased.ts'

const showAll = () => true
const hideAll = () => false

describe('stripUnreleased', () => {
  it('unwraps a visible block, keeping its content and dropping the tags', () => {
    const input = [
      'before',
      '<SinceVersion v="2.9.0">',
      'gated',
      '</SinceVersion>',
      'after'
    ].join('\n')
    expect(stripUnreleased(input, showAll)).toBe(
      ['before', 'gated', 'after'].join('\n')
    )
  })

  it('removes a hidden block entirely, including its content', () => {
    const input = [
      'before',
      '<SinceVersion v="2.9.0">',
      'gated',
      '</SinceVersion>',
      'after'
    ].join('\n')
    expect(stripUnreleased(input, hideAll)).toBe(['before', 'after'].join('\n'))
  })

  it('keeps a visible outer block while dropping a hidden nested one', () => {
    const input = [
      '<SinceVersion v="2.9.0">',
      'outer',
      '<SinceVersion v="3.0.0">',
      'inner',
      '</SinceVersion>',
      'tail',
      '</SinceVersion>'
    ].join('\n')
    const isVisible = (v: string) => v === '2.9.0'
    expect(stripUnreleased(input, isVisible)).toBe(['outer', 'tail'].join('\n'))
  })

  it('drops a whole hidden block even when it nests a visible one', () => {
    const input = [
      '<SinceVersion v="3.0.0">',
      'outer',
      '<SinceVersion v="2.9.0">',
      'inner',
      '</SinceVersion>',
      'tail',
      '</SinceVersion>'
    ].join('\n')
    const isVisible = (v: string) => v === '2.9.0'
    expect(stripUnreleased(input, isVisible)).toBe('')
  })

  it('gates a tag that carries extra attributes alongside v', () => {
    const input = [
      'before',
      '<SinceVersion v="2.9.0" disclaimer="block">',
      'gated',
      '</SinceVersion>',
      'after'
    ].join('\n')
    expect(stripUnreleased(input, hideAll)).toBe(['before', 'after'].join('\n'))
    expect(stripUnreleased(input, showAll)).toBe(
      ['before', 'gated', 'after'].join('\n')
    )
  })

  it('leaves SinceVersion-like text inside a fenced code block untouched', () => {
    const input = [
      'intro',
      '```tsx',
      '<SinceVersion v="9.9.9">',
      'not a real tag',
      '</SinceVersion>',
      '```',
      'outro'
    ].join('\n')
    expect(stripUnreleased(input, hideAll)).toBe(input)
  })
})

describe('gatedHeadingIds', () => {
  it('collects the explicit id of a heading inside a hidden block', () => {
    const input = [
      '## Shipped [#shipped]',
      '<SinceVersion v="2.9.0">',
      '## React Router v8 [#react-router-v8]',
      '</SinceVersion>'
    ].join('\n')
    expect(gatedHeadingIds(input, hideAll)).toEqual(new Set(['react-router-v8']))
  })

  it('collects nothing when the block is visible', () => {
    const input = [
      '<SinceVersion v="2.9.0">',
      '## React Router v8 [#react-router-v8]',
      '</SinceVersion>'
    ].join('\n')
    expect(gatedHeadingIds(input, showAll)).toEqual(new Set())
  })

  it('falls back to a slug when the heading has no explicit id', () => {
    const input = [
      '<SinceVersion v="2.9.0">',
      '### Some New Option',
      '</SinceVersion>'
    ].join('\n')
    expect(gatedHeadingIds(input, hideAll)).toEqual(new Set(['some-new-option']))
  })

  it('uses the explicit id for a heading that carries inline JSX', () => {
    const input = [
      '<SinceVersion v="2.9.0">',
      "## <Icon className='mr-2' />React Router v8 [#react-router-v8]",
      '</SinceVersion>'
    ].join('\n')
    expect(gatedHeadingIds(input, hideAll)).toEqual(new Set(['react-router-v8']))
  })

  it('ignores headings outside any hidden block', () => {
    const input = ['## Visible [#visible]', 'body'].join('\n')
    expect(gatedHeadingIds(input, hideAll)).toEqual(new Set())
  })

  it('ignores heading-like lines inside fenced code blocks', () => {
    const input = [
      '<SinceVersion v="2.9.0">',
      '```md',
      '## Not a heading [#nope]',
      '```',
      '## Real [#real]',
      '</SinceVersion>'
    ].join('\n')
    expect(gatedHeadingIds(input, hideAll)).toEqual(new Set(['real']))
  })

  it('collects nested headings of a hidden block', () => {
    const input = [
      '<SinceVersion v="2.9.0">',
      '## Parent [#parent]',
      '### Child [#child]',
      '</SinceVersion>'
    ].join('\n')
    expect(gatedHeadingIds(input, hideAll)).toEqual(
      new Set(['parent', 'child'])
    )
  })
})
