import { describe, expect, it } from 'vitest'
import {
  isThemeSwitcherKeydown,
  readThemeSwitcherKey,
  resolveThemeSwitcherKey
} from './theme-switcher-key'

describe('resolveThemeSwitcherKey', () => {
  it('defaults to d when the setting is missing', () => {
    expect(resolveThemeSwitcherKey(null)).toBe('d')
    expect(resolveThemeSwitcherKey('')).toBe('d')
    expect(resolveThemeSwitcherKey('  ')).toBe('d')
  })
  it('returns null when disabled', () => {
    expect(resolveThemeSwitcherKey('disabled')).toBeNull()
    expect(resolveThemeSwitcherKey(' Disabled ')).toBeNull()
  })
  it('normalises a custom key', () => {
    expect(resolveThemeSwitcherKey('T')).toBe('t')
    expect(resolveThemeSwitcherKey(' F2 ')).toBe('f2')
  })
})

describe('readThemeSwitcherKey', () => {
  it('reads from storage', () => {
    expect(readThemeSwitcherKey({ getItem: () => 'x' })).toBe('x')
  })
  it('falls back to d when storage throws', () => {
    expect(
      readThemeSwitcherKey({
        getItem: () => {
          throw new Error('SecurityError')
        }
      })
    ).toBe('d')
  })
})

function keydown(
  overrides: Partial<Parameters<typeof isThemeSwitcherKeydown>[0]> = {}
) {
  return {
    key: 'd',
    defaultPrevented: false,
    repeat: false,
    isComposing: false,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    target: { closest: () => null },
    ...overrides
  }
}

describe('isThemeSwitcherKeydown', () => {
  it('matches the configured key regardless of case', () => {
    expect(isThemeSwitcherKeydown(keydown(), 'd')).toBe(true)
    expect(isThemeSwitcherKeydown(keydown({ key: 'D' }), 'd')).toBe(true)
    expect(isThemeSwitcherKeydown(keydown({ key: 'T' }), 't')).toBe(true)
    expect(isThemeSwitcherKeydown(keydown(), 't')).toBe(false)
  })
  it('never matches when disabled', () => {
    expect(isThemeSwitcherKeydown(keydown(), null)).toBe(false)
  })
  it('ignores modified, repeated and handled keypresses', () => {
    expect(isThemeSwitcherKeydown(keydown({ metaKey: true }), 'd')).toBe(false)
    expect(isThemeSwitcherKeydown(keydown({ ctrlKey: true }), 'd')).toBe(false)
    expect(isThemeSwitcherKeydown(keydown({ altKey: true }), 'd')).toBe(false)
    expect(isThemeSwitcherKeydown(keydown({ repeat: true }), 'd')).toBe(false)
    expect(isThemeSwitcherKeydown(keydown({ isComposing: true }), 'd')).toBe(
      false
    )
    expect(
      isThemeSwitcherKeydown(keydown({ defaultPrevented: true }), 'd')
    ).toBe(false)
  })
  it('ignores keypresses inside editable elements', () => {
    expect(
      isThemeSwitcherKeydown(keydown({ target: { closest: () => ({}) } }), 'd')
    ).toBe(false)
    expect(isThemeSwitcherKeydown(keydown({ target: null }), 'd')).toBe(true)
  })
})
