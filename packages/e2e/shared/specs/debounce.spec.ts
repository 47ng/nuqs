import { expect, test as it } from '@playwright/test'
import { defineTest, type TestConfig } from '../define-test'
import { navigateTo } from '../playwright/navigate'
import { getUrl } from './debounce.defs'

type TestDebounceConfig = TestConfig & {
  otherPath?: string
}

export function testDebounce(config: TestDebounceConfig) {
  const test = defineTest('Debounce', ({ path }) => {
    it('should debounce the input', async ({ page }) => {
      const DEBOUNCE_TIME = 200
      await navigateTo(page, getUrl(path, { debounceTime: DEBOUNCE_TIME }))
      await page.locator('input[type="text"]').fill('pass')
      await expect(page.locator('#client-state')).toHaveText(
        '{"search":"pass","pageIndex":0}'
      )
      await expect(page.locator('#server-state')).toHaveText(
        '{"search":"","pageIndex":0}'
      )
      await expect(page).toHaveURL(
        url => url.search === `?debounceTime=${DEBOUNCE_TIME}`
      )
      await page.waitForTimeout(DEBOUNCE_TIME)
      await expect(page).toHaveURL(
        url => url.search === `?debounceTime=${DEBOUNCE_TIME}&q=pass`
      )
      await expect(page.locator('#server-state')).toHaveText(
        '{"search":"pass","pageIndex":0}'
      )
      await expect(page.locator('#client-state')).toHaveText(
        '{"search":"pass","pageIndex":0}'
      )
    })

    it('should debounce the input while allowing the page index to increment', async ({
      page
    }) => {
      const DEBOUNCE_TIME = 400
      await page.clock.install({ time: 0 })
      await navigateTo(page, getUrl(path, { debounceTime: DEBOUNCE_TIME }))
      await page.clock.pauseAt(60_000)
      await page.locator('input[type="text"]').fill('pass')
      const incrementButton = page.locator('button#increment-page-index')
      await incrementButton.click({ force: true })
      await incrementButton.click({ force: true })
      await incrementButton.click({ force: true })
      await expect(page.locator('#client-state')).toHaveText(
        '{"search":"pass","pageIndex":3}'
      )
      await page.clock.runFor(0)
      await expect(page).toHaveURL(
        url => url.search === `?debounceTime=${DEBOUNCE_TIME}&page=3`
      )
      await expect(page.locator('#server-state')).toHaveText(
        '{"search":"","pageIndex":3}'
      )
      await page.clock.runFor(DEBOUNCE_TIME + 1)
      await expect(page).toHaveURL(
        url => url.search === `?debounceTime=${DEBOUNCE_TIME}&page=3&q=pass`
      )
      await expect(page.locator('#server-state')).toHaveText(
        '{"search":"pass","pageIndex":3}'
      )
      await expect(page.locator('#client-state')).toHaveText(
        '{"search":"pass","pageIndex":3}'
      )
    })

    it('should cancel a debounce when the back button is clicked', async ({
      page
    }) => {
      await navigateTo(page, config.otherPath ?? path + '/other')
      await navigateTo(page, getUrl(path, { debounceTime: 200 }))
      await page.locator('input[type="text"]').pressSequentially('fail')
      await page.goBack()
      await page.waitForTimeout(300)
      await expect(page).toHaveURL(url => url.search === '')
    })
  })
  test(config)
}
