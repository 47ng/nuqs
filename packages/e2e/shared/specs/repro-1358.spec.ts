import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { expectSearch } from '../playwright/expect-url'
import { navigateTo } from '../playwright/navigate'

export const testRepro1358 = defineTest('repro-1358', ({ path }) => {
  it('should use the correct derived value after navigating between routes', async ({
    page
  }) => {
    // Navigate to Route A
    await navigateTo(page, path + '/a')
    // Wait for the render-time effect to have run (mode appears in URL)
    await expectSearch(page, { mode: 'default' })
    await expect(page.locator('#route-label').first()).toHaveText('Route A')
    await expect(page.locator('#filter').first()).toHaveText('default - AAA')

    // Navigate to Route B
    await page.getByRole('link', { name: 'Go to Route B' }).click()
    // Wait for Route B's render-time effect to have run
    await expect(page).toHaveURL(
      url =>
        url.pathname.endsWith(`${path}/b`) &&
        url.searchParams.get('mode') === 'default'
    )
    await expect(page.locator('#route-label').first()).toHaveText('Route B')
    // The filter should be Route B's derived value, not Route A's
    await expect(page.locator('#filter').first()).toHaveText('default - BBB')
  })

  it('should not leak state from Route A into Route B on navigation', async ({
    page
  }) => {
    // Navigate to Route A, wait for effect
    await navigateTo(page, path + '/a')
    await expectSearch(page, { mode: 'default' })
    await expect(page.locator('#filter').first()).toHaveText('default - AAA')

    // Navigate to Route B
    await page.getByRole('link', { name: 'Go to Route B' }).click()
    await expect(page).toHaveURL(
      url =>
        url.pathname.endsWith(`${path}/b`) &&
        url.searchParams.get('mode') === 'default'
    )
    await expect(page.locator('#route-label').first()).toHaveText('Route B')
    // Route A's filter value should NOT appear on Route B
    await expect(page.locator('#filter').first()).not.toHaveText(
      'default - AAA'
    )
    await expect(page.locator('#filter').first()).toHaveText('default - BBB')
  })

  it('should not leak state from Route B into Route A on back navigation', async ({
    page
  }) => {
    // Navigate to Route A, wait for effect
    await navigateTo(page, path + '/a')
    await expectSearch(page, { mode: 'default' })

    // Navigate to Route B, wait for effect
    await page.getByRole('link', { name: 'Go to Route B' }).click()
    await expect(page).toHaveURL(
      url =>
        url.pathname.endsWith(`${path}/b`) &&
        url.searchParams.get('mode') === 'default'
    )
    await expect(page.locator('#filter').first()).toHaveText('default - BBB')

    // Navigate back to Route A
    await page.goBack()
    await expect(page).toHaveURL(
      url => url.pathname.endsWith(`${path}/a`) // support basePath
    )
    await expect(page.locator('#route-label').first()).toHaveText('Route A')
    await expect(page.locator('#filter').first()).not.toHaveText(
      'default - BBB'
    )
    await expect(page.locator('#filter').first()).toHaveText('default - AAA')
  })
})
