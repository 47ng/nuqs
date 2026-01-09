import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testRepro1293PageA = defineTest('repro-1293', ({ path }) => {
  it('should maintain query state isolation for Page A', async ({ page }) => {
    // Navigate to Page A with count=1
    await navigateTo(page, path + '?count=1')

    // Verify Page A shows count=1
    await expect(page.locator('#client-count')).toHaveText('1')
    await expect(page.locator('#client-expected')).toHaveText('1')

    // Navigate to Page B
    await page.getByRole('link', { name: 'Go to Page B' }).click()
    await expect(page).toHaveURL('/repro-1293/pageB?count=2')

    // Verify Page B shows count=2
    await expect(page.locator('#client-count')).toHaveText('2')
    await expect(page.locator('#client-expected')).toHaveText('2')

    // Navigate back to Page A (critical test)
    await page.getByRole('link', { name: 'Go to Page A' }).click()
    await expect(page).toHaveURL('/repro-1293/pageA?count=1')

    // Verify Page A still shows count=1 (this is where the bug manifests)
    await expect(page.locator('#client-count')).toHaveText('1')
    await expect(page.locator('#client-expected')).toHaveText('1')

    // Rapid navigation to stress test state isolation
    for (let i = 0; i < 3; i++) {
      await page.getByRole('link', { name: 'Go to Page B' }).click()
      await expect(page).toHaveURL('/repro-1293/pageB?count=2')
      await expect(page.locator('#client-count')).toHaveText('2')

      await page.getByRole('link', { name: 'Go to Page A' }).click()
      await expect(page).toHaveURL('/repro-1293/pageA?count=1')
      await expect(page.locator('#client-count')).toHaveText('1')
    }
  })
})

export const testRepro1293PageB = defineTest('repro-1293', ({ path }) => {
  it('should maintain query state isolation for Page B', async ({ page }) => {
    // Navigate to Page B with count=2
    await navigateTo(page, path + '?count=2')

    // Verify Page B shows count=2
    await expect(page.locator('#client-count')).toHaveText('2')
    await expect(page.locator('#client-expected')).toHaveText('2')

    // Navigate to Page A
    await page.getByRole('link', { name: 'Go to Page A' }).click()
    await expect(page).toHaveURL('/repro-1293/pageA?count=1')

    // Verify Page A shows count=1
    await expect(page.locator('#client-count')).toHaveText('1')
    await expect(page.locator('#client-expected')).toHaveText('1')

    // Navigate back to Page B (critical test)
    await page.getByRole('link', { name: 'Go to Page B' }).click()
    await expect(page).toHaveURL('/repro-1293/pageB?count=2')

    // Verify Page B still shows count=2 (this is where the bug manifests)
    await expect(page.locator('#client-count')).toHaveText('2')
    await expect(page.locator('#client-expected')).toHaveText('2')

    // Rapid navigation to stress test state isolation
    for (let i = 0; i < 3; i++) {
      await page.getByRole('link', { name: 'Go to Page A' }).click()
      await expect(page).toHaveURL('/repro-1293/pageA?count=1')
      await expect(page.locator('#client-count')).toHaveText('1')

      await page.getByRole('link', { name: 'Go to Page B' }).click()
      await expect(page).toHaveURL('/repro-1293/pageB?count=2')
      await expect(page.locator('#client-count')).toHaveText('2')
    }
  })
})
