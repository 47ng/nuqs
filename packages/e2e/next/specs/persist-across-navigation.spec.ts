import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('Persists search params across navigation using a generated Link href', async ({
  page
}) => {
  await navigateTo(page, '/app/persist-across-navigation/a')
  await page.getByRole('textbox').fill('foo')
  await page.getByRole('checkbox').check()
  await page.locator('a').click()
  await expect(page).toHaveURL(/\/app\/persist-across-navigation\/b/)
  await expect(page).toHaveURL(url => url.search === '?q=foo&checked=true')
  await expect(page.getByRole('textbox')).toHaveValue('foo')
  await expect(page.getByRole('checkbox')).toBeChecked()
})
