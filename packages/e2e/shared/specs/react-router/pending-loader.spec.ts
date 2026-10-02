import { expect, test as it, type Page } from '@playwright/test'
import { defineTest } from '../../define-test'
import { expectSearch } from '../../playwright/expect-url'
import { readHistoryIndex } from '../../playwright/history'
import { navigateTo } from '../../playwright/navigate'
import type { LoaderRequestData } from './pending-loader.defs'

async function readLoaderControl(page: Page) {
  return page.evaluate(() => ({
    requests:
      window.pendingLoaderControl?.requests.map(({ data, aborted }) => ({
        data,
        aborted
      })) ?? [],
    completed: window.pendingLoaderControl?.completed ?? []
  }))
}

async function releaseLoader(page: Page, id: number) {
  await page.evaluate(async id => {
    const request = window.pendingLoaderControl?.requests[id - 1]
    if (!request) {
      throw new Error(`Loader ${id} has not started`)
    }
    request.release()
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  }, id)
}

async function expectLoaderData(page: Page, data: LoaderRequestData) {
  await expect(page.locator('#loader-data')).toHaveText(JSON.stringify(data))
}

async function expectLatestState(page: Page) {
  await expectSearch(page, { q: 'tea', page: '2', panel: 'open' })
  await expect(page.locator('#q-state')).toHaveText('tea')
  await expect(page.locator('#page-state')).toHaveText('2')
  await expect(page.locator('#panel-state')).toHaveText('open')
  await expectLoaderData(page, { q: 'tea', page: '2', panel: 'before' })
  await expect(page.locator('#navigation-state')).toHaveText('idle')
}

export const testPendingLoader = defineTest(
  'Out-of-order loaders',
  ({ path }) => {
    for (const qHistory of ['replace', 'push'] as const) {
      for (const pageHistory of ['replace', 'push'] as const) {
        for (const firstKey of ['q', 'page'] as const) {
          const secondKey = firstKey === 'q' ? 'page' : 'q'
          it(`keeps the latest state when ${firstKey} finishes last (q: ${qHistory}, page: ${pageHistory})`, async ({
            page
          }) => {
            await navigateTo(
              page,
              path,
              `?q=init&page=1&qHistory=${qHistory}&pageHistory=${pageHistory}`
            )
            await expectLoaderData(page, { q: 'init', page: '1', panel: null })
            await expect(page.locator('#navigation-state')).toHaveText('idle')

            await page.locator(`#set-${firstKey}`).click()
            const firstData =
              firstKey === 'q'
                ? { q: 'tea', page: '1', panel: null }
                : { q: 'init', page: '2', panel: null }
            await expect
              .poll(() => readLoaderControl(page))
              .toEqual({
                requests: [{ data: firstData, aborted: false }],
                completed: []
              })
            await expect(page.locator('#navigation-state')).toHaveText(
              'loading'
            )

            await page.locator('#panel-before').click()
            await expectSearch(page, { ...firstData, panel: 'before' })
            await expect(page.locator('#panel-state')).toHaveText('before')
            await page.locator(`#set-${secondKey}`).click()
            const pending = {
              requests: [
                { data: firstData, aborted: true },
                {
                  data: { q: 'tea', page: '2', panel: 'before' },
                  aborted: false
                }
              ],
              completed: []
            }
            await expect.poll(() => readLoaderControl(page)).toEqual(pending)

            await page.locator('#panel-open').click()
            await expectSearch(page, { q: 'tea', page: '2', panel: 'open' })
            await expect(page.locator('#q-state')).toHaveText('tea')
            await expect(page.locator('#page-state')).toHaveText('2')
            await expect(page.locator('#panel-state')).toHaveText('open')
            await expectLoaderData(page, { q: 'init', page: '1', panel: null })
            await expect(page.locator('#navigation-state')).toHaveText(
              'loading'
            )
            expect(await readLoaderControl(page)).toEqual(pending)

            await releaseLoader(page, 2)
            await expectLatestState(page)
            expect(await readLoaderControl(page)).toEqual({
              ...pending,
              completed: [2]
            })
            const latestUrl = page.url()
            const latestIndex = await readHistoryIndex(page)
            const latestLength = await page.evaluate(() => history.length)

            await releaseLoader(page, 1)
            expect(await readLoaderControl(page)).toEqual({
              ...pending,
              completed: [2, 1]
            })
            await expectLatestState(page)
            expect(page.url()).toBe(latestUrl)
            expect(await readHistoryIndex(page)).toBe(latestIndex)
            expect(await page.evaluate(() => history.length)).toBe(latestLength)
          })
        }
      }
    }
  }
)
