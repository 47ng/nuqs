import { expect, test, type Page } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

async function readState(page: Page) {
  return page
    .locator('[data-testid="nuqs-value"], [data-testid="router-value"]')
    .evaluateAll(elements => ({
      url: location.search,
      nuqs: elements[0]?.textContent,
      router: elements[1]?.textContent,
      panel: document.querySelector('[data-testid="folder-panel"]')?.textContent
    }))
}

const syncedState = {
  url: '?folder=abc',
  nuqs: 'abc',
  router: 'abc',
  panel: 'Contents of folder "abc"'
}

test('adopts an external URL update after the render suspends', async ({
  page
}) => {
  await navigateTo(page, '/repro-1501')

  await page.getByRole('link', { name: 'Open folder abc' }).click()

  await expect.poll(() => readState(page)).toEqual(syncedState)
})

test('reads the URL on a full page load', async ({ page }) => {
  await navigateTo(page, '/repro-1501?folder=abc')

  await expect.poll(() => readState(page)).toEqual(syncedState)
})
