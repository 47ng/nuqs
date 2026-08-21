import {
  isThemeSwitcherKeydown,
  readThemeSwitcherKey
} from '@/src/lib/theme-switcher-key'

window.addEventListener('keydown', event => {
  if (!isThemeSwitcherKeydown(event, readThemeSwitcherKey(localStorage))) {
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
