import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test.describe('React adapter popstate queue reset', () => {
  test('cancels a pending debounced update on browser back', async ({
    page
  }) => {
    await navigateTo(page, '/popstate-queue-reset', '?q=selected')

    const queryValue = page.locator('#client-query-value')
    const updateStatus = page.locator('#client-update-status')
    await expect(queryValue).toHaveText('selected')

    await page.getByRole('button', { name: 'Push current value' }).click()
    await expect(updateStatus).toHaveText('settled')
    await expect(page).toHaveURL(url => url.search === '?q=current')
    await expect(queryValue).toHaveText('current')

    await page.getByRole('textbox', { name: 'Query' }).fill('pending')
    await expect(updateStatus).toHaveText('pending')
    await expect(queryValue).toHaveText('pending')
    await expect(page).toHaveURL(url => url.search === '?q=current')

    await page.goBack()

    await expect(updateStatus).toHaveText('settled')
    await expect(page).toHaveURL(url => url.search === '?q=selected')
    await expect(queryValue).toHaveText('selected')
  })
})
