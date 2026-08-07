window.addEventListener('keydown', event => {
  if (
    event.key.toLowerCase() !== 'd' ||
    event.defaultPrevented ||
    event.repeat ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    (event.target instanceof HTMLElement &&
      event.target.closest('input, textarea, select, [contenteditable]'))
  ) {
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
