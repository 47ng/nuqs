import { describe, expect, it } from 'vitest'
import { stripUnreleased } from './strip-unreleased.ts'

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
