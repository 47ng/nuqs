import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testReferentialStability = defineTest(
  'Referential stability',
  ({ path }) => {
    it('keeps referential stability of the setter function across updates', async ({
      page
    }) => {
      await navigateTo(page, path)
      await expect(page.locator('#state')).toHaveText('pass')
      await page.locator('button').click()
      await expect(page.locator('#state')).toHaveText('pass')
    })
  }
)
