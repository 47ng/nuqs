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
  it('normalises a custom key', () => {
    expect(resolveThemeSwitcherSettings('T', null).key).toBe('t')
    expect(resolveThemeSwitcherSettings(' F2 ', null).key).toBe('f2')
  })
  it('keeps the custom key when disabled', () => {
    expect(resolveThemeSwitcherSettings('t', 'true')).toEqual({
      key: 't',
      enabled: false
    })
  })
  it('treats anything but true as enabled', () => {
    expect(resolveThemeSwitcherSettings(null, 'false').enabled).toBe(true)
    expect(resolveThemeSwitcherSettings(null, 'yes').enabled).toBe(true)
  })
})

describe('activeThemeSwitcherKey', () => {
  it('returns the key only when enabled', () => {
    expect(activeThemeSwitcherKey({ key: 't', enabled: true })).toBe('t')
    expect(activeThemeSwitcherKey({ key: 't', enabled: false })).toBeNull()
  })
})

describe('readThemeSwitcherSettings', () => {
  it('reads both entries from storage', () => {
    const store: Record<string, string> = {
      'theme-switcher-key': 'x',
      'theme-switcher-key-disabled': 'true'
    }
    expect(
      readThemeSwitcherSettings({ getItem: name => store[name] ?? null })
    ).toEqual({ key: 'x', enabled: false })
  })
  it('falls back to defaults when storage throws', () => {
    expect(
      readThemeSwitcherSettings({
        getItem: () => {
          throw new Error('SecurityError')
        }
      })
    ).toEqual({ key: 'd', enabled: true })
  })
})

function storage() {
  return { setItem: vi.fn(), removeItem: vi.fn() }
}

describe('writeThemeSwitcherKey', () => {
  it('removes the entry for the default key', () => {
    const s = storage()
    writeThemeSwitcherKey(s, 'd')
    expect(s.removeItem).toHaveBeenCalledExactlyOnceWith('theme-switcher-key')
    expect(s.setItem).not.toHaveBeenCalled()
  })
  it('stores a custom key', () => {
    const s = storage()
    writeThemeSwitcherKey(s, 't')
    expect(s.setItem).toHaveBeenCalledExactlyOnceWith('theme-switcher-key', 't')
  })
})

describe('writeThemeSwitcherEnabled', () => {
  it('stores the disabled flag without touching the key', () => {
    const s = storage()
    writeThemeSwitcherEnabled(s, false)
    expect(s.setItem).toHaveBeenCalledExactlyOnceWith(
      'theme-switcher-key-disabled',
      'true'
    )
    expect(s.removeItem).not.toHaveBeenCalled()
  })
  it('removes the disabled flag when enabling', () => {
    const s = storage()
    writeThemeSwitcherEnabled(s, true)
    expect(s.removeItem).toHaveBeenCalledExactlyOnceWith(
      'theme-switcher-key-disabled'
    )
    expect(s.setItem).not.toHaveBeenCalled()
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
  })
})

describe('isAssignableThemeSwitcherKey', () => {
  it('rejects modifiers and escape', () => {
    for (const key of ['Shift', 'Control', 'Alt', 'Meta', 'Escape']) {
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
    expect(formatThemeSwitcherKey('f2')).toBe('f2')
  })
})
