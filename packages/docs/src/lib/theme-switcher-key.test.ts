import { describe, expect, it, vi } from 'vitest'
import {
  activeThemeSwitcherKey,
  formatThemeSwitcherKey,
  isAssignableThemeSwitcherKey,
  isThemeSwitcherKeydown,
  readThemeSwitcherSettings,
  resolveThemeSwitcherSettings,
  writeThemeSwitcherEnabled,
  writeThemeSwitcherKey
} from './theme-switcher-key'

describe('resolveThemeSwitcherSettings', () => {
  it('defaults to an enabled d when nothing is stored', () => {
    expect(resolveThemeSwitcherSettings(null, null)).toEqual({
      key: 'd',
      enabled: true
    })
    expect(resolveThemeSwitcherSettings('  ', '')).toEqual({
      key: 'd',
      enabled: true
    })
  })
  it('keeps the stored key spelling', () => {
    expect(resolveThemeSwitcherSettings('T', null).key).toBe('T')
    expect(resolveThemeSwitcherSettings(' F2 ', null).key).toBe('F2')
    expect(resolveThemeSwitcherSettings('ArrowUp', null).key).toBe('ArrowUp')
  })
  it('keeps the custom key when disabled', () => {
    expect(resolveThemeSwitcherSettings('t', 'true')).toEqual({
      key: 't',
      enabled: false
    })
    expect(resolveThemeSwitcherSettings('t', ' true ').enabled).toBe(false)
  })
  it('treats anything but true as enabled', () => {
    expect(resolveThemeSwitcherSettings(null, 'false').enabled).toBe(true)
    expect(resolveThemeSwitcherSettings(null, 'TRUE').enabled).toBe(true)
  })
})

describe('activeThemeSwitcherKey', () => {
  it('returns the key only when enabled', () => {
    expect(activeThemeSwitcherKey({ key: 't', enabled: true })).toBe('t')
    expect(activeThemeSwitcherKey({ key: 't', enabled: false })).toBeNull()
  })
})

function throwing(): never {
  throw new Error('SecurityError')
}

describe('readThemeSwitcherSettings', () => {
  it('reads both entries from storage', () => {
    const store: Record<string, string> = {
      'theme-switcher-key': 'x',
      'theme-switcher-key-disabled': 'true'
    }
    expect(
      readThemeSwitcherSettings(() => ({
        getItem: name => store[name] ?? null
      }))
    ).toEqual({ key: 'x', enabled: false })
  })
  it('falls back to defaults when getItem throws', () => {
    expect(readThemeSwitcherSettings(() => ({ getItem: throwing }))).toEqual({
      key: 'd',
      enabled: true
    })
  })
  it('falls back to defaults when storage access throws', () => {
    expect(readThemeSwitcherSettings(throwing)).toEqual({
      key: 'd',
      enabled: true
    })
  })
})

function storage() {
  return { setItem: vi.fn(), removeItem: vi.fn() }
}

describe('writeThemeSwitcherKey', () => {
  it('removes the entry for the default key', () => {
    const s = storage()
    writeThemeSwitcherKey(() => s, 'd')
    expect(s.removeItem).toHaveBeenCalledExactlyOnceWith('theme-switcher-key')
    expect(s.setItem).not.toHaveBeenCalled()
  })
  it('stores a custom key as spelled', () => {
    const s = storage()
    writeThemeSwitcherKey(() => s, 'ArrowUp')
    expect(s.setItem).toHaveBeenCalledExactlyOnceWith(
      'theme-switcher-key',
      'ArrowUp'
    )
  })
  it('does not throw when storage is blocked', () => {
    expect(() => writeThemeSwitcherKey(throwing, 't')).not.toThrow()
    expect(() =>
      writeThemeSwitcherKey(
        () => ({ setItem: throwing, removeItem: throwing }),
        't'
      )
    ).not.toThrow()
  })
})

describe('writeThemeSwitcherEnabled', () => {
  it('stores the disabled flag without touching the key', () => {
    const s = storage()
    writeThemeSwitcherEnabled(() => s, false)
    expect(s.setItem).toHaveBeenCalledExactlyOnceWith(
      'theme-switcher-key-disabled',
      'true'
    )
    expect(s.removeItem).not.toHaveBeenCalled()
  })
  it('removes the disabled flag when enabling', () => {
    const s = storage()
    writeThemeSwitcherEnabled(() => s, true)
    expect(s.removeItem).toHaveBeenCalledExactlyOnceWith(
      'theme-switcher-key-disabled'
    )
    expect(s.setItem).not.toHaveBeenCalled()
  })
  it('does not throw when storage is blocked', () => {
    expect(() => writeThemeSwitcherEnabled(throwing, false)).not.toThrow()
  })
})

describe('write then read round-trip', () => {
  it('matches a keydown with the same key', () => {
    const store = new Map<string, string>()
    const s = {
      getItem: (name: string) => store.get(name) ?? null,
      setItem: (name: string, value: string) => void store.set(name, value),
      removeItem: (name: string) => void store.delete(name)
    }
    for (const key of ['d', 'T', 'ArrowUp', 'F2']) {
      writeThemeSwitcherKey(() => s, key)
      const settings = readThemeSwitcherSettings(() => s)
      expect(
        isThemeSwitcherKeydown(
          keydown({ key }),
          activeThemeSwitcherKey(settings)
        )
      ).toBe(true)
    }
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
    expect(isThemeSwitcherKeydown(keydown({ key: 'ArrowUp' }), 'ArrowUp')).toBe(
      true
    )
    expect(isThemeSwitcherKeydown(keydown(), 't')).toBe(false)
  })
  it('never matches when disabled', () => {
    expect(isThemeSwitcherKeydown(keydown(), null)).toBe(false)
  })
  it('ignores modified, repeated, composing and handled keypresses', () => {
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
    expect(isThemeSwitcherKeydown(keydown({ target: {} }), 'd')).toBe(true)
  })
})

describe('isAssignableThemeSwitcherKey', () => {
  it('rejects modifiers, escape and navigation keys', () => {
    for (const key of [
      'Shift',
      'Control',
      'Alt',
      'Meta',
      'Escape',
      'Tab',
      'Enter',
      ' '
    ]) {
      expect(isAssignableThemeSwitcherKey(key)).toBe(false)
    }
  })
  it('accepts printable and function keys', () => {
    for (const key of ['t', 'D', '/', 'F2', 'ArrowUp']) {
      expect(isAssignableThemeSwitcherKey(key)).toBe(true)
    }
  })
})

describe('formatThemeSwitcherKey', () => {
  it('uppercases single characters and keeps named keys', () => {
    expect(formatThemeSwitcherKey('d')).toBe('D')
    expect(formatThemeSwitcherKey('F2')).toBe('F2')
    expect(formatThemeSwitcherKey('ArrowUp')).toBe('ArrowUp')
  })
})
