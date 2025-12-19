import type { Page } from '@playwright/test'

export async function navigateTo(page: Page, pathname: string, search = '') {
  // Needs relative URLs for basePath support
  const relativePathname = pathname.startsWith('.') ? pathname : `.${pathname}`
  const relativeUrl = `${relativePathname}${search}`
  await page.goto(relativeUrl)
  await page.locator('#hydration-marker').waitFor({ state: 'hidden' })
}
