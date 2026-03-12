import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testRepro1358 = defineTest('repro-1358', ({ path }) => {
  it('should use the correct default value after navigating between routes with different defaults', async ({
    page
  }) => {
    // Navigate to Route A
    await navigateTo(page, path + '/a')
    await expect(page.locator('#route-label')).toHaveText('Route A')
    await expect(page.locator('#filter')).toHaveText('AAA')
    await expect(page.locator('#mode')).toHaveText('default')

    // Navigate to Route B
    await page.getByRole('link', { name: 'Go to Route B' }).click()
    await expect(page.locator('#route-label')).toHaveText('Route B')
    await expect(page.locator('#filter')).toHaveText('BBB')
    await expect(page.locator('#mode')).toHaveText('default')
  })

  it('should not leak state from Route A into Route B on navigation', async ({
    page
  }) => {
    // Navigate to Route A
    await navigateTo(page, path + '/a')
    await expect(page.locator('#filter')).toHaveText('AAA')

    // Navigate to Route B and verify Route A default does not bleed
    await page.getByRole('link', { name: 'Go to Route B' }).click()
    await expect(page.locator('#route-label')).toHaveText('Route B')
    // The filter should be BBB (Route B's default), not AAA (Route A's)
    await expect(page.locator('#filter')).not.toHaveText('AAA')
    await expect(page.locator('#filter')).toHaveText('BBB')
  })

  it('should not leak state from Route B into Route A on back navigation', async ({
    page
  }) => {
    // Navigate to Route A, then to Route B
    await navigateTo(page, path + '/a')
    await page.getByRole('link', { name: 'Go to Route B' }).click()
    await expect(page.locator('#route-label')).toHaveText('Route B')
    await expect(page.locator('#filter')).toHaveText('BBB')

    // Navigate back to Route A
    await page.goBack()
    await expect(page.locator('#route-label')).toHaveText('Route A')
    await expect(page.locator('#filter')).toHaveText('AAA')
    await expect(page.locator('#filter')).not.toHaveText('BBB')
  })
})
