import type { Page } from '@playwright/test'

export type NavigateOptions = {
  isHashRouter?: boolean
}

export async function navigateTo(
  page: Page,
  pathname: string,
  search = '',
  options: NavigateOptions = {}
) {
  const { isHashRouter = false } = options

  let relativeUrl: string
  if (isHashRouter) {
    // For HashRouter, construct URL as ./#/pathname?search
    const hashPath = pathname.startsWith('/') ? pathname : `/${pathname}`
    relativeUrl = `./#${hashPath}${search}`
  } else {
    // Needs relative URLs for basePath support
    const relativePathname = pathname.startsWith('.') ? pathname : `.${pathname}`
    relativeUrl = `${relativePathname}${search}`
  }

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
