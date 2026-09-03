import { expect, test as it, type Page } from '@playwright/test'
import { defineTest } from '../../define-test'
import { expectSearch } from '../../playwright/expect-url'
import { readHistoryIndex } from '../../playwright/history'
import { navigateTo } from '../../playwright/navigate'

async function navigateToRepro(page: Page, path: string, search: string) {
  const searchParams = new URLSearchParams(search)
  searchParams.set('loaderId', crypto.randomUUID())
  await navigateTo(page, path, `?${searchParams}`)
}

async function readLoaderCall(page: Page): Promise<number> {
  return Number(await page.locator('#loader-call').textContent())
}

export const testRepro1563 = defineTest('repro-1563', ({ path }) => {
  it('advances the router history index on push with shallow: false', async ({
    page
  }) => {
    await navigateToRepro(page, path, '?test=init')
    const initialIndex = await readHistoryIndex(page)
    await page.locator('#push').click()
    await expect(page).toHaveURL(url => url.searchParams.get('test') === 'pass')
    await expect(page.locator('#state')).toHaveText('pass')
    await expect(page.locator('#navigation-type')).toHaveText('PUSH')
    expect(await readHistoryIndex(page)).toBe(initialIndex + 1)
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
  })

  it('repairs the optimistic entry when the router replaces it before the pending push commits', async ({
    page
  }) => {
    await navigateToRepro(page, path, '?test=init&delay=1000')
    const initialIndex = await readHistoryIndex(page)
    const initialHistoryLength = await page.evaluate(() => history.length)

    await page.locator('#push').click()
    await expect(page.locator('#navigation-state')).toHaveText('loading')
    await page.locator('#router-replace').click()
    await expect(page.locator('#navigation-state')).toHaveText('idle')
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        url.searchParams.get('redirected') === 'pass'
    )

    expect(await readHistoryIndex(page)).toBe(initialIndex + 1)
    expect(await page.evaluate(() => history.length)).toBe(
      initialHistoryLength + 1
    )

    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
    await page.goForward()
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        url.searchParams.get('redirected') === 'pass'
    )
    expect(await readHistoryIndex(page)).toBe(initialIndex + 1)
  })

  for (const history of ['replace', 'push'] as const) {
    it(`does not run loaders for shallow ${history}`, async ({ page }) => {
      await navigateToRepro(page, path, '?test=init')
      const loaderCall = await page.locator('#loader-call').textContent()

      await page.locator(`#shallow-${history}`).click()
      await expect(page).toHaveURL(
        url => url.searchParams.get('shallow') === 'pass'
      )
      await expect(page.locator('#loader-call')).toHaveText(loaderCall ?? '')
    })
  }

  it('keeps the history index on an idle deep replace', async ({ page }) => {
    await navigateToRepro(page, path, '?test=init')
    const initialIndex = await readHistoryIndex(page)
    await page.locator('#replace').click()
    await expect(page).toHaveURL(
      url => url.searchParams.get('other') === 'pass'
    )
    await expect(page.locator('#navigation-type')).toHaveText('REPLACE')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
    await page.goBack()
    expect(page.url()).not.toContain(path)
  })

  it('lets a deep replace take over a pending deep push', async ({ page }) => {
    await navigateToRepro(page, path, '?test=init&delay=1000')
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

  it('keeps a shallow replace made while a deep push is pending', async ({
    page
  }) => {
    await navigateToRepro(page, path, '?test=init&delay=1000')
    const initialIndex = await readHistoryIndex(page)
    const initialLoaderCall = await readLoaderCall(page)
    await page.locator('#push').click()
    await expect(page.locator('#navigation-state')).toHaveText('loading')
    await page.locator('#shallow-replace').click()
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        url.searchParams.get('shallow') === 'pass'
    )
    await expect(page.locator('#shallow-state')).toHaveText('pass')
    await expect.poll(() => readHistoryIndex(page)).toBe(initialIndex + 1)
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        url.searchParams.get('shallow') === 'pass'
    )
    await expect(page.locator('#state')).toHaveText('pass')
    await expect(page.locator('#shallow-state')).toHaveText('pass')
    await expect(page.locator('#navigation-type')).toHaveText('PUSH')
    expect(await readLoaderCall(page)).toBe(initialLoaderCall + 1)
    await page.goBack()
    await expect(page).toHaveURL(url => !url.searchParams.has('shallow'))
    await expect(page.locator('#state')).toHaveText('init')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
  })

  it('keeps a shallow replace made while a deep replace is pending', async ({
    page
  }) => {
    await navigateToRepro(page, path, '?test=init&delay=1000')
    const initialIndex = await readHistoryIndex(page)
    const initialLoaderCall = await readLoaderCall(page)
    await page.locator('#deep-replace').click()
    await expect(page.locator('#navigation-state')).toHaveText('loading')
    await page.locator('#shallow-replace').click()
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        url.searchParams.get('shallow') === 'pass'
    )
    await expect(page.locator('#navigation-state')).toHaveText('idle')
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        url.searchParams.get('shallow') === 'pass'
    )
    expect(await readHistoryIndex(page)).toBe(initialIndex)
    expect(await readLoaderCall(page)).toBe(initialLoaderCall + 1)
  })

  it('keeps a shallow push made while a deep push is pending', async ({
    page
  }) => {
    await navigateToRepro(page, path, '?test=init&delay=1000')
    const initialIndex = await readHistoryIndex(page)
    const initialLoaderCall = await readLoaderCall(page)
    await page.locator('#push').click()
    await expect(page.locator('#navigation-state')).toHaveText('loading')
    await page.locator('#shallow-push').click()
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        url.searchParams.get('shallow') === 'pass'
    )
    await expect(page.locator('#navigation-state')).toHaveText('idle')
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        url.searchParams.get('shallow') === 'pass'
    )
    expect(await readHistoryIndex(page)).toBe(initialIndex + 1)
    expect(await readLoaderCall(page)).toBe(initialLoaderCall + 1)
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
  })

  it('keeps a shallow push made while a deep replace is pending', async ({
    page
  }) => {
    await navigateToRepro(page, path, '?test=init&delay=1000')
    const initialLoaderCall = await readLoaderCall(page)
    const initialHistoryLength = await page.evaluate(() => history.length)
    await page.locator('#deep-replace').click()
    await expect(page.locator('#navigation-state')).toHaveText('loading')
    await page.locator('#shallow-push').click()
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        url.searchParams.get('shallow') === 'pass'
    )
    await expect(page.locator('#navigation-state')).toHaveText('idle')
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        url.searchParams.get('shallow') === 'pass'
    )
    expect(await readLoaderCall(page)).toBe(initialLoaderCall + 1)
    expect(await page.evaluate(() => history.length)).toBe(
      initialHistoryLength + 1
    )
  })

  it('does not let a pending deep replace mutate history after Back', async ({
    page
  }) => {
    await navigateToRepro(page, path, '?test=init&delay=1000')
    const initialIndex = await readHistoryIndex(page)
    await page.locator('#deep-replace').click()
    await expect(page.locator('#navigation-state')).toHaveText('loading')
    await page.locator('#shallow-push').click()
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        url.searchParams.get('shallow') === 'pass'
    )
    await page.goBack()
    await expect(page.locator('#navigation-state')).toHaveText('idle')
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        !url.searchParams.has('shallow')
    )
    expect(await readHistoryIndex(page)).toBe(initialIndex)
    await page.waitForTimeout(1100)
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('test') === 'pass' &&
        !url.searchParams.has('shallow')
    )
    expect(await readHistoryIndex(page)).toBe(initialIndex)
  })

  it('repairs the optimistic entry when Back runs before the commit', async ({
    page
  }) => {
    await navigateToRepro(page, path, '?test=init&delay=1000')
    const initialIndex = await readHistoryIndex(page)
    await page.locator('#push').click()
    await expect(page).toHaveURL(url => url.searchParams.get('test') === 'pass')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    await page.goForward()
    await expect(page.locator('#state')).toHaveText('pass')
    await expect(page.locator('#navigation-type')).toHaveText('POP')
    expect(await readHistoryIndex(page)).toBe(initialIndex + 1)
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
  })

  it('repairs the optimistic entry after a replace on the entry behind it', async ({
    page
  }) => {
    await navigateToRepro(page, path, '?test=init&delay=1000')
    const initialIndex = await readHistoryIndex(page)
    await page.locator('#push').click()
    await expect(page).toHaveURL(url => url.searchParams.get('test') === 'pass')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    await page.locator('#replace').click()
    await expect(page.locator('#navigation-type')).toHaveText('REPLACE')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
    await page.goForward()
    await expect(page.locator('#state')).toHaveText('pass')
    expect(await readHistoryIndex(page)).toBe(initialIndex + 1)
  })

  it('repairs the optimistic entry after a shallow update moved its URL', async ({
    page
  }) => {
    await navigateToRepro(page, path, '?test=init&delay=1000')
    const initialIndex = await readHistoryIndex(page)
    await page.locator('#push').click()
    await expect(page).toHaveURL(url => url.searchParams.get('test') === 'pass')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
    await page.locator('#shallow-replace').click()
    await expectSearch(page, { test: 'pass', shallow: 'pass' })
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    await page.goForward()
    await expect(page.locator('#state')).toHaveText('pass')
    await expectSearch(page, { test: 'pass', shallow: 'pass' })
    expect(await readHistoryIndex(page)).toBe(initialIndex + 1)
  })

  it('pushes again after Back cancelled a pending deep push', async ({
    page
  }) => {
    await navigateToRepro(page, path, '?test=init&delay=1000')
    const initialIndex = await readHistoryIndex(page)
    await page.locator('#push').click()
    await expect(page).toHaveURL(url => url.searchParams.get('test') === 'pass')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    await page.locator('#push').click()
    await expect(page.locator('#state')).toHaveText('pass')
    await expect.poll(() => readHistoryIndex(page)).toBe(initialIndex + 1)
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    expect(await readHistoryIndex(page)).toBe(initialIndex)
  })

  it('shallow-pushes after Back cancelled a pending deep push', async ({
    page
  }) => {
    await navigateToRepro(page, path, '?test=init&delay=1000')
    const initialIndex = await readHistoryIndex(page)
    await page.locator('#push').click()
    await expect(page).toHaveURL(url => url.searchParams.get('test') === 'pass')
    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    await page.locator('#shallow-push').click()
    await expect(page.locator('#shallow-state')).toHaveText('pass')
    await expect(page).toHaveURL(
      url => url.searchParams.get('shallow') === 'pass'
    )
    expect(await readHistoryIndex(page)).toBe(initialIndex)
    await page.goBack()
    await expect(page).toHaveURL(url => url.searchParams.get('test') === 'init')
    await expect(page.locator('#state')).toHaveText('init')
    await expect(page.locator('#shallow-state')).toBeEmpty()
    expect(await readHistoryIndex(page)).toBe(initialIndex)
  })
})
