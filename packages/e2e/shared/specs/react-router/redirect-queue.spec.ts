import { expect, test as it, type Page } from '@playwright/test'
import { defineTest } from '../../define-test'
import { expectSearch } from '../../playwright/expect-url'
import { navigateTo } from '../../playwright/navigate'
import { panelDebounceMs } from './redirect-queue.defs'

async function queuePanelDuringNavigation(page: Page) {
  await page.locator('#set-q').click()
  await expect(page.locator('#navigation-state')).toHaveText('loading')
  await expectSearch(page, { q: 'tea' })
  await expect(page).toHaveURL(url => !url.searchParams.has('panel'))
  await expect(page.locator('#loader-data')).toHaveText(
    JSON.stringify({ q: 'init', panel: null })
  )
  await page.clock.install({ time: 0 })
  await page.clock.pauseAt(1)
  await page.locator('#queue-panel').click()
  await expect(page.locator('#panel-state')).toHaveText('local')
  await expectSearch(page, { q: 'tea' })
  await expect(page).toHaveURL(url => !url.searchParams.has('panel'))
  expect(
    await page.evaluate(() => window.redirectQueueControl?.requests)
  ).toEqual([{ q: 'tea', panel: null }])
}

export const testRedirectQueue = defineTest('Redirect queue', ({ path }) => {
  for (const history of ['replace', 'push'] as const) {
    it(`cancels a debounced panel edit when a deep ${history} redirects`, async ({
      page
    }) => {
      await navigateTo(page, path, `?q=init&qHistory=${history}&redirect=true`)
      await queuePanelDuringNavigation(page)
      await page.evaluate(() => window.redirectQueueControl!.release())
      await expect(page.locator('#navigation-state')).toHaveText('idle')
      await expect(page).toHaveURL(
        url =>
          url.pathname === path && url.search === '?q=redirected&panel=server'
      )
      await expect(page.locator('#loader-data')).toHaveText(
        JSON.stringify({ q: 'redirected', panel: 'server' })
      )

      await page.clock.runFor(panelDebounceMs + 100)
      await expect(page).toHaveURL(
        url =>
          url.pathname === path && url.search === '?q=redirected&panel=server'
      )
      await expect(page.locator('#q-state')).toHaveText('redirected')
      await expect(page.locator('#panel-state')).toHaveText('server')
      await expect(page.locator('#loader-data')).toHaveText(
        JSON.stringify({ q: 'redirected', panel: 'server' })
      )
      expect(
        await page.evaluate(() => window.redirectQueueControl?.requests)
      ).toEqual([
        { q: 'tea', panel: null },
        { q: 'redirected', panel: 'server' }
      ])
    })

    it(`keeps a debounced panel edit when a deep ${history} commits its request`, async ({
      page
    }) => {
      await navigateTo(page, path, `?q=init&qHistory=${history}`)
      await queuePanelDuringNavigation(page)
      await page.evaluate(() => window.redirectQueueControl!.release())
      await expect(page.locator('#navigation-state')).toHaveText('idle')
      await expect(page.locator('#loader-data')).toHaveText(
        JSON.stringify({ q: 'tea', panel: null })
      )
      await expect(page.locator('#q-state')).toHaveText('tea')
      await expect(page.locator('#panel-state')).toHaveText('local')
      await expect(page).toHaveURL(
        url =>
          url.pathname === path && url.search === `?q=tea&qHistory=${history}`
      )

      await page.clock.runFor(panelDebounceMs + 100)
      await expect(page).toHaveURL(
        url =>
          url.pathname === path &&
          url.search === `?q=tea&qHistory=${history}&panel=local`
      )
      await expect(page.locator('#q-state')).toHaveText('tea')
      await expect(page.locator('#panel-state')).toHaveText('local')
      await expect(page.locator('#loader-data')).toHaveText(
        JSON.stringify({ q: 'tea', panel: null })
      )
      await expect(page.locator('#navigation-state')).toHaveText('idle')
      expect(
        await page.evaluate(() => window.redirectQueueControl?.requests)
      ).toEqual([{ q: 'tea', panel: null }])
    })
  }
})
