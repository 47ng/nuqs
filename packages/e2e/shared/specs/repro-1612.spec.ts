import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { setupLogSpy } from '../playwright/log-spy'
import { navigateTo } from '../playwright/navigate'

export const testRepro1612 = defineTest('repro-1612', ({ path }) => {
  for (const trigger of ['async', 'sync']) {
    it(`keeps the selection when a child clears an unrelated key on mount (${trigger} update)`, async ({
      page
    }) => {
      using logSpy = setupLogSpy(page)
      await navigateTo(page, path)
      await expect(page.locator('#selected')).toHaveText('null')
      logSpy.logs.length = 0

      await page.getByRole('button', { name: trigger, exact: true }).click()
      await expect(page).toHaveURL(
        url => url.searchParams.get('selected') === 'item-1'
      )
      await expect(page.locator('#child')).toBeVisible()
      // The bug reverts to the correct final state, so give it time to show
      await page.waitForTimeout(300)

      const sequence = logSpy.logs.filter(
        log => log.startsWith('commit:') || log.startsWith('child:')
      )
      expect(sequence).toEqual(['child:mount', 'commit:item-1'])
    })
  }
})
