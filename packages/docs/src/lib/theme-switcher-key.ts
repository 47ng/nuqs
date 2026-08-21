export const THEME_SWITCHER_KEY_STORAGE_KEY = 'theme-switcher-key'
export const DEFAULT_THEME_SWITCHER_KEY = 'd'
const DISABLED = 'disabled'

export function resolveThemeSwitcherKey(stored: string | null): string | null {
  const value = stored?.trim().toLowerCase() ?? ''
  if (value === '') {
    return DEFAULT_THEME_SWITCHER_KEY
  }
  if (value === DISABLED) {
    return null
  }
  return value
}

export function readThemeSwitcherKey(storage: Pick<Storage, 'getItem'>) {
  try {
    return resolveThemeSwitcherKey(
      storage.getItem(THEME_SWITCHER_KEY_STORAGE_KEY)
    )
  } catch {
    return DEFAULT_THEME_SWITCHER_KEY
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
