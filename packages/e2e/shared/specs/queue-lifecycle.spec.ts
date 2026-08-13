import { expect, test as it } from '@playwright/test'
import { defineTest, type TestConfig } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testQueueLifecycle = defineTest(
  'Queue lifecycle',
  ({ path }: TestConfig) => {
    it('cancels a queued update on native Back after the last query subscriber unmounts', async ({
      page
    }) => {
      await navigateTo(page, path)

      await page.getByRole('button', { name: 'Create history entry' }).click()
      await expect(page.locator('#client-push-status')).toHaveText('settled')
      await expect(page).toHaveURL(url => url.search === '?test=current')

      await page
        .getByRole('button', { name: 'Queue update and unmount' })
        .click()
      await expect(page.locator('#client-queue-status')).toHaveText('pending')
      await expect(page.locator('#no-query-subscribers')).toBeVisible()
      await expect(page.locator('#client-query-value')).toHaveCount(0)

      await page.goBack()
      await expect(page).toHaveURL(url => url.search === '')

      const queueStatus = page.locator('#client-queue-status')
      await expect(queueStatus).toHaveText(/^(?:cancelled|applied|error)$/)
      await expect.soft(queueStatus).toHaveText('cancelled', { timeout: 250 })
      await expect.soft(page).toHaveURL(url => url.search === '', {
        timeout: 250
      })
    })
  }
)
