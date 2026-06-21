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
  await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
}
