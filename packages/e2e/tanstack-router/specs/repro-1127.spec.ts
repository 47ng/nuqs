import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('reads back an array of objects from the URL (#1127)', async ({
  page
}) => {
  await navigateTo(page, '/repro-1127', '?sorting=[{"id":"name","desc":true}]')
  await expect(page.locator('#state')).toHaveText('[{"id":"name","desc":true}]')
  await page.getByText('Sort').click()
  await expect(page.locator('#state')).toHaveText('[{"id":"name","desc":true}]')
})
