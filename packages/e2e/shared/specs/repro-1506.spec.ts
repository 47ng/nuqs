import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testRepro1506 = defineTest('repro-1506', ({ path }) => {
  it('keeps the new value committed during a colocated transition', async ({
    page
  }) => {
    await navigateTo(page, path)

    const count = page.getByLabel('Count')
    const committedValues = page.getByLabel('Committed values')

    await expect(count).toHaveText('0')
    await expect(committedValues).toHaveText('0')

    await page.getByRole('button', { name: 'Increment' }).click()

    await expect(page).toHaveURL(/\?count=1$/)
    await expect(count).toHaveText('1')
    await expect(committedValues).toHaveText('0,1')
  })
})
