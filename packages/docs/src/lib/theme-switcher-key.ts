export const THEME_SWITCHER_KEY_STORAGE_KEY = 'theme-switcher-key'
export const THEME_SWITCHER_DISABLED_STORAGE_KEY = 'theme-switcher-key-disabled'
export const DEFAULT_THEME_SWITCHER_KEY = 'd'

export type ThemeSwitcherSettings = {
  key: string
  enabled: boolean
}

export function resolveThemeSwitcherSettings(
  storedKey: string | null,
  storedDisabled: string | null
): ThemeSwitcherSettings {
  const key = storedKey?.trim().toLowerCase() ?? ''
  return {
    key: key === '' ? DEFAULT_THEME_SWITCHER_KEY : key,
    enabled: storedDisabled?.trim() !== 'true'
  }
}

export function readThemeSwitcherSettings(
  storage: Pick<Storage, 'getItem'>
): ThemeSwitcherSettings {
  try {
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

type WritableStorage = Pick<Storage, 'setItem' | 'removeItem'>

export function writeThemeSwitcherKey(storage: WritableStorage, key: string) {
  try {
    if (key === DEFAULT_THEME_SWITCHER_KEY) {
      storage.removeItem(THEME_SWITCHER_KEY_STORAGE_KEY)
    } else {
      storage.setItem(THEME_SWITCHER_KEY_STORAGE_KEY, key)
    }
  } catch {
    return
  }
}

export function writeThemeSwitcherEnabled(
  storage: WritableStorage,
  enabled: boolean
) {
  try {
    if (enabled) {
      storage.removeItem(THEME_SWITCHER_DISABLED_STORAGE_KEY)
    } else {
      storage.setItem(THEME_SWITCHER_DISABLED_STORAGE_KEY, 'true')
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
    event.key.toLowerCase() === switcherKey &&
    !event.defaultPrevented &&
    !event.repeat &&
    !event.isComposing &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !isEditableTarget(event.target)
  )
}

const MODIFIER_KEYS = new Set(['shift', 'control', 'alt', 'meta'])

export function isAssignableThemeSwitcherKey(key: string) {
  const value = key.toLowerCase()
  return value !== 'escape' && !MODIFIER_KEYS.has(value)
}

export function formatThemeSwitcherKey(key: string) {
  return key.length === 1 ? key.toUpperCase() : key
}
