export const THEME_SWITCHER_KEY_STORAGE_KEY = 'theme-switcher-key'
export const THEME_SWITCHER_DISABLED_STORAGE_KEY = 'theme-switcher-key-disabled'
export const DEFAULT_THEME_SWITCHER_KEY = 'd'

export type ThemeSwitcherSettings = {
  key: string
  enabled: boolean
}

type ReadableStorage = Pick<Storage, 'getItem'>
type WritableStorage = Pick<Storage, 'setItem' | 'removeItem'>

export function resolveThemeSwitcherSettings(
  storedKey: string | null,
  storedDisabled: string | null
): ThemeSwitcherSettings {
  const key = storedKey?.trim() ?? ''
  return {
    key: key === '' ? DEFAULT_THEME_SWITCHER_KEY : key,
    enabled: storedDisabled?.trim() !== 'true'
  }
}

export function readThemeSwitcherSettings(
  getStorage: () => ReadableStorage
): ThemeSwitcherSettings {
  try {
    const storage = getStorage()
    return resolveThemeSwitcherSettings(
      storage.getItem(THEME_SWITCHER_KEY_STORAGE_KEY),
      storage.getItem(THEME_SWITCHER_DISABLED_STORAGE_KEY)
    )
  } catch {
    return resolveThemeSwitcherSettings(null, null)
  }
}

export function activeThemeSwitcherKey(settings: ThemeSwitcherSettings) {
  return settings.enabled ? settings.key : null
}

export function writeThemeSwitcherKey(
  getStorage: () => WritableStorage,
  key: string
) {
  try {
    if (key === DEFAULT_THEME_SWITCHER_KEY) {
      getStorage().removeItem(THEME_SWITCHER_KEY_STORAGE_KEY)
    } else {
      getStorage().setItem(THEME_SWITCHER_KEY_STORAGE_KEY, key)
    }
  } catch {
    return
  }
}

export function writeThemeSwitcherEnabled(
  getStorage: () => WritableStorage,
  enabled: boolean
) {
  try {
    if (enabled) {
      getStorage().removeItem(THEME_SWITCHER_DISABLED_STORAGE_KEY)
    } else {
      getStorage().setItem(THEME_SWITCHER_DISABLED_STORAGE_KEY, 'true')
    }
  } catch {
    return
  }
}

type KeydownLike = Pick<
  KeyboardEvent,
  | 'key'
  | 'defaultPrevented'
  | 'repeat'
  | 'isComposing'
  | 'metaKey'
  | 'ctrlKey'
  | 'altKey'
> & { target: unknown }

function isEditableTarget(target: unknown) {
  return (
    typeof target === 'object' &&
    target !== null &&
    'closest' in target &&
    typeof target.closest === 'function' &&
    target.closest('input, textarea, select, [contenteditable]') !== null
  )
}

export function isThemeSwitcherKeydown(
  event: KeydownLike,
  switcherKey: string | null
) {
  return (
    switcherKey !== null &&
    event.key.toLowerCase() === switcherKey.toLowerCase() &&
    !event.defaultPrevented &&
    !event.repeat &&
    !event.isComposing &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !isEditableTarget(event.target)
  )
}

const UNASSIGNABLE_KEYS = new Set([
  'shift',
  'control',
  'alt',
  'meta',
  'escape',
  'tab',
  'enter',
  ' '
])

export function isAssignableThemeSwitcherKey(key: string) {
  return !UNASSIGNABLE_KEYS.has(key.toLowerCase())
}

export function formatThemeSwitcherKey(key: string) {
  return key.length === 1 ? key.toUpperCase() : key
}
