import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('keeps double slashes in unrelated query values (#1602)', async ({
  page
}) => {
  const returnUrl = 'https://example.com/some/path?foo=1&bar=2'
  await navigateTo(
    page,
    '/repro-1602',
    `?returnUrl=${encodeURIComponent(returnUrl)}`
  )
  await page.getByText('Set search').click()
  await expect(page.locator('#state')).toHaveText('test')
  await expect(page).toHaveURL(
    url =>
      url.pathname === '/repro-1602' &&
      url.searchParams.get('returnUrl') === returnUrl &&
      url.searchParams.get('search') === 'test'
  )
})
