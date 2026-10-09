import type { Page } from '@playwright/test'

export async function navigateTo(page: Page, pathname: string, search = '') {
  // Needs relative URLs for basePath support
  const relativePathname = pathname.startsWith('.') ? pathname : `.${pathname}`
  const relativeUrl = `${relativePathname}${search}`
  const response = await page.goto(relativeUrl)
  if (!response?.ok()) {
    throw new Error(
      `Failed to navigate to ${relativeUrl}: ${
        response ? response.status() : 'no response'
      }`
    )
  }
  await page.waitForLoadState('networkidle')
  // The hidden marker is inserted by an effect. Waiting for "hidden" also
  // succeeds before it exists, allowing interactions before hydration.
  await page.locator('#hydration-marker').waitFor({ state: 'attached' })
}
