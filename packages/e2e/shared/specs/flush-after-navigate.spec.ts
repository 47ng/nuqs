import { expect, type Page, test as it } from '@playwright/test'
import { defineTest, type TestConfig } from '../define-test'
import { createSearchMatcher } from '../playwright/expect-url'
import { navigateTo } from '../playwright/navigate'
import { getUrl } from './flush-after-navigate.defs'

async function expectPathname(page: Page, pathname: string) {
  await expect(page).toHaveURL(url => url.pathname.endsWith(pathname))
}

export function testFlushAfterNavigate(config: TestConfig) {
  const shallows = [true, false]
  const histories = ['push', 'replace'] as const
  for (const shallow of shallows) {
    for (const history of histories) {
      const test = defineTest(
        {
          label: 'Flush after navigate',
          variants: `shallow: ${shallow}, history: ${history}`
        },
        ({ path, isHashRouter }) => {
          const timeMs = 200
          it('should not apply pending search params after navigation', async ({
            page
          }) => {
            await navigateTo(
              page,
              getUrl(path + '/start', { shallow, history, debounce: timeMs }),
              '',
              { isHashRouter }
            )
            async function runTest() {
              await page.locator('#test').click()
              await page.locator('a').click()
              await expectPathname(page, path + '/end')
              await expect(page.locator('#client-useQueryState')).toBeEmpty()
              await expect(page.locator('#client-useQueryStates')).toBeEmpty()
              await expect(page).toHaveURL(
                createSearchMatcher('', isHashRouter ?? false)
              )
              await page.waitForTimeout(timeMs)
              await expect(page.locator('#client-useQueryState')).toBeEmpty()
              await expect(page.locator('#client-useQueryStates')).toBeEmpty()
              await expect(page).toHaveURL(
                createSearchMatcher('', isHashRouter ?? false)
              )
            }
            await runTest()
            await page.goBack()
            await runTest()
          })
          it('should not apply pending search params on top of existing link state when navigating to another page', async ({
            page
          }) => {
            await navigateTo(
              page,
              getUrl(path + '/start', {
                shallow,
                history,
                debounce: timeMs,
                linkState: 'nav'
              }),
              '',
              { isHashRouter }
            )
            async function runTest() {
              await page.locator('#test').click()
              await page.locator('a').click()
              await expectPathname(page, path + '/end')
              await expect(page.locator('#client-useQueryState')).toHaveText(
                'nav'
              )
              await expect(page.locator('#client-useQueryStates')).toHaveText(
                'nav'
              )
              await expect(page).toHaveURL(
                createSearchMatcher('?test=nav', isHashRouter ?? false)
              )
              await page.waitForTimeout(timeMs)
              await expect(page.locator('#client-useQueryState')).toHaveText(
                'nav'
              )
              await expect(page.locator('#client-useQueryStates')).toHaveText(
                'nav'
              )
              await expect(page).toHaveURL(
                createSearchMatcher('?test=nav', isHashRouter ?? false)
              )
            }
            await runTest()
            await page.goBack()
            await runTest()
          })
          it('should not apply pending search params on top of existing link state when navigating to the same page', async ({
            page
          }) => {
            await navigateTo(
              page,
              getUrl(path + '/start', {
                shallow,
                history,
                debounce: timeMs,
                linkPath: '/start',
                linkState: 'nav'
              }),
              '',
              { isHashRouter }
            )
            async function runTest() {
              await page.locator('#test').click()
              await page.locator('a').click()
              await expectPathname(page, path + '/start')
              await expect(page).toHaveURL(
                createSearchMatcher('?test=nav', isHashRouter ?? false)
              )
              await expect(page.locator('#client-state')).toHaveText('nav')
              await page.waitForTimeout(timeMs)
              await expect(page.locator('#client-state')).toHaveText('nav')
              await expect(page).toHaveURL(
                createSearchMatcher('?test=nav', isHashRouter ?? false)
              )
            }
            await runTest()
            await page.goBack()
            await runTest()
          })
          it('should not apply pending search params queued while throttled after navigation', async ({
            page
          }) => {
            await navigateTo(
              page,
              getUrl(path + '/start', { shallow, history, throttle: timeMs }),
              '',
              { isHashRouter }
            )
            async function runTest() {
              await page.locator('#preflush').click() // Trigger an immediate flush to enable the throttling queue
              await page.locator('#test').click() // Queue the change
              await page.locator('a').click() // Navigate
              await expectPathname(page, path + '/end')
              await expect(page.locator('#client-useQueryState')).toBeEmpty()
              await expect(page.locator('#client-useQueryStates')).toBeEmpty()
              await expect(page).toHaveURL(
                createSearchMatcher('', isHashRouter ?? false)
              )
              await page.waitForTimeout(timeMs)
              await expect(page.locator('#client-useQueryState')).toBeEmpty()
              await expect(page.locator('#client-useQueryStates')).toBeEmpty()
              await expect(page).toHaveURL(
                createSearchMatcher('', isHashRouter ?? false)
              )
            }
            await runTest()
            await page.goBack()
            await runTest()
          })
          it('should not apply pending search params queued while throttled after navigation with link state', async ({
            page
          }) => {
            await navigateTo(
              page,
              getUrl(path + '/start', {
                shallow,
                history,
                throttle: timeMs,
                linkState: 'nav'
              }),
              '',
              { isHashRouter }
            )
            async function runTest() {
              await page.locator('#preflush').click() // Trigger an immediate flush to enable the throttling queue
              await page.locator('#test').click() // Queue the change
              await page.locator('a').click() // Navigate
              await expectPathname(page, path + '/end')
              await expect(page.locator('#client-useQueryState')).toHaveText(
                'nav'
              )
              await expect(page.locator('#client-useQueryStates')).toHaveText(
                'nav'
              )
              await expect(page).toHaveURL(
                createSearchMatcher('?test=nav', isHashRouter ?? false)
              )
              await page.waitForTimeout(timeMs)
              await expect(page.locator('#client-useQueryState')).toHaveText(
                'nav'
              )
              await expect(page.locator('#client-useQueryStates')).toHaveText(
                'nav'
              )
              await expect(page).toHaveURL(
                createSearchMatcher('?test=nav', isHashRouter ?? false)
              )
            }
            await runTest()
            await page.goBack()
            await runTest()
          })
          it('should not apply pending search params queued while throttled after navigation with link state to the same page', async ({
            page
          }) => {
            await navigateTo(
              page,
              getUrl(path + '/start', {
                shallow,
                history,
                throttle: timeMs,
                linkPath: '/start',
                linkState: 'nav'
              }),
              '',
              { isHashRouter }
            )
            async function runTest() {
              await page.locator('#preflush').click() // Trigger an immediate flush to enable the throttling queue
              await page.locator('#test').click() // Queue the change
              await page.locator('a').click() // Navigate
              await expectPathname(page, path + '/start')
              await expect(page.locator('#client-state')).toHaveText('nav')
              await expect(page).toHaveURL(
                createSearchMatcher('?test=nav', isHashRouter ?? false)
              )
              await page.waitForTimeout(timeMs)
              await expect(page.locator('#client-state')).toHaveText('nav')
              await expect(page).toHaveURL(
                createSearchMatcher('?test=nav', isHashRouter ?? false)
              )
            }
            await runTest()
            await page.goBack()
            await runTest()
          })
        }
      )
      test(config)
    }
  }
}
