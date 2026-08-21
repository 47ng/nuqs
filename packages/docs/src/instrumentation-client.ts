import {
  activeThemeSwitcherKey,
  isThemeSwitcherKeydown,
  readThemeSwitcherSettings
} from '@/src/lib/theme-switcher-key'

window.addEventListener('keydown', event => {
  const switcherKey = activeThemeSwitcherKey(
    readThemeSwitcherSettings(localStorage)
  )
  if (!isThemeSwitcherKeydown(event, switcherKey)) {
    return
  }

  const nextTheme = document.documentElement.classList.contains('dark')
    ? 'light'
    : 'dark'

  document
    .querySelector<HTMLButtonElement>(
      `button[data-theme-toggle], [data-theme-toggle] button[aria-label="${nextTheme}"]`
    )
    ?.click()
})
