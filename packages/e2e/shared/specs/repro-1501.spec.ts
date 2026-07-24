import { expect, test as it, type Page } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

async function readState(page: Page) {
  return page.evaluate(() => {
    const browser = globalThis as unknown as {
      location: { search: string }
      document: {
        querySelector(selector: string): { textContent: string | null } | null
      }
    }
    return {
      url: browser.location.search,
      nuqs: browser.document.querySelector('[data-testid="nuqs-value"]')
        ?.textContent,
      router: browser.document.querySelector('[data-testid="router-value"]')
        ?.textContent,
      panel: browser.document.querySelector('[data-testid="folder-panel"]')
        ?.textContent
    }
  })
}

const syncedState = {
  url: '?folder=abc',
  nuqs: 'abc',
  router: 'abc',
  panel: 'Contents of folder "abc"'
}

export const testRepro1501 = defineTest('repro-1501', ({ path }) => {
  it('adopts an external URL update after the render suspends', async ({
    page
  }) => {
    await navigateTo(page, path)

    await page.getByRole('link', { name: 'Open folder abc' }).click()

    await expect.poll(() => readState(page)).toEqual(syncedState)
  })

  it('reads the URL on a full page load', async ({ page }) => {
    await navigateTo(page, `${path}?folder=abc`)

    await expect.poll(() => readState(page)).toEqual(syncedState)
  })
})
