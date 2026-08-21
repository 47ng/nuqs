import {
  activeThemeSwitcherKey,
  isThemeSwitcherKeydown,
  readThemeSwitcherSettings
} from '@/src/lib/theme-switcher-key'

window.addEventListener('keydown', event => {
  const switcherKey = activeThemeSwitcherKey(
    readThemeSwitcherSettings(() => localStorage)
  )
  if (!isThemeSwitcherKeydown(event, switcherKey)) {
    return
  }
  document
    .querySelector<HTMLButtonElement>('button[data-theme-toggle]')
    ?.click()
})
