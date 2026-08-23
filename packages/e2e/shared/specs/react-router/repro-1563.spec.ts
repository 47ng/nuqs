import { expect, test as it } from '@playwright/test'
import { defineTest } from '../../define-test'
import { readHistoryIndex } from '../../playwright/history'
import { navigateTo } from '../../playwright/navigate'

export const testRepro1563 = defineTest('repro-1563', ({ path }) => {
  it('advances the router history index on push with shallow: false', async ({
    page
  }) => {
    await navigateTo(page, path, '?test=init')
    const initialIndex = await readHistoryIndex(page)
    await page.locator('#push').click()
    await expect(page).toHaveURL(url => url.search === '?test=pass')
    await expect(page.locator('#state')).toHaveText('pass')
    await expect(page.locator('#navigation-type')).toHaveText('PUSH')
    expect(await readHistoryIndex(page)).toBe(initialIndex + 1)
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
  })

  it('lets a deep replace take over a pending deep push', async ({ page }) => {
    await navigateTo(page, path, '?test=init&delay=1000')
    const initialIndex = await readHistoryIndex(page)
    await page.locator('#push-then-replace').click()
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        url.searchParams.get('other') === 'pass'
    )
    await expect.poll(() => readHistoryIndex(page)).toBe(initialIndex + 1)
    await expect(page.locator('#state')).toHaveText('pass')
    await expect(page.locator('#navigation-type')).toHaveText('PUSH')
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
  })
})
