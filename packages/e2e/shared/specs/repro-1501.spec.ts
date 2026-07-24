import { expect, test as it, type Page } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

async function expectSyncedState(page: Page) {
  await expect(page).toHaveURL(url => url.searchParams.get('folder') === 'abc')
  await expect(page.getByTestId('router-value')).toHaveText('abc')
  await expect(page.getByTestId('nuqs-value')).toHaveText('abc')
  await expect(page.getByTestId('folder-panel')).toHaveText(
    'Contents of folder "abc"'
  )
}

export const testRepro1501 = defineTest('repro-1501', ({ path }) => {
  it('adopts an external URL update after the render suspends', async ({
    page
  }) => {
    await navigateTo(page, path)

    await page.getByRole('link', { name: 'Open folder abc' }).click()

    await expectSyncedState(page)
  })

  it('reads the URL on a full page load', async ({ page }) => {
    await navigateTo(page, `${path}?folder=abc`)

    await expectSyncedState(page)
  })
})
