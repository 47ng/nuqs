import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('does not append a second query string on dynamic routes (#1590)', async ({
  page
}) => {
  await navigateTo(page, '/repro-1590/customers', '?limit=25&view=data')
  await page.getByText('Set view').click()
  await expect(page.locator('#state')).toHaveText('structure')
  await expect(page).toHaveURL(
    url =>
      url.pathname === '/repro-1590/customers' &&
      url.search === '?limit=25&view=structure'
  )
})
