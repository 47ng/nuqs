import { expect, type Page, test as it } from '@playwright/test'
import { defineTest, type TestConfig } from '../define-test'
import { navigateTo } from '../playwright/navigate'
import { setupUrlSpy } from '../playwright/url-spy'
import { getUrl } from './stitching.defs'

type Config = TestConfig & {
  enableShallowFalse?: boolean
}

async function expectNoStitchingError(page: Page) {
  await expect(page.locator('#stitching-error')).toBeEmpty()
}

export function testStitching({
  enableShallowFalse = true,
  ...config
}: Config) {
  // Keep one trace across actions so a delayed router commit of the same URL
  // is deduplicated consistently, even after an assertion has completed.
  const expectedSearches: Array<Record<string, string>> = [
    { a: '1' },
    { a: '1', b: '1' },
    { a: '1', b: '1', c: '1' },
    { a: '2', b: '1', c: '1' },
    { a: '2', b: '2', c: '1' },
    { a: '2', b: '2', c: '2' },
    { a: '3', b: '2', c: '2' },
    { a: '4', b: '2', c: '2' },
    { a: '4', b: '4', c: '2' },
    { a: '4', b: '4', c: '4' }
  ]
  const hooks = ['useQueryState', 'useQueryStates'] as const
  const shallows = enableShallowFalse ? [true, false] : [true]
  const histories = ['replace', 'push'] as const
  for (const hook of hooks) {
    for (const shallow of shallows) {
      for (const history of histories) {
        const test = defineTest(
          {
            label: 'Stitching',
            variants: `shallow: ${shallow}, history: ${history}`
          },
          ({ path }) => {
            it('should update the state optimistically and sequence the URL updates', async ({
              page
            }) => {
              await navigateTo(page, getUrl(path, { hook, shallow, history }))
              using urlSpy = setupUrlSpy(page)
              await page.locator('#same-tick').click()
              await expect(page.locator('#client-state')).toHaveText('1,1,1')
              await urlSpy.assertSearches(expectedSearches.slice(0, 3))
              await expectNoStitchingError(page)
              await page.locator('#same-tick').click()
              await expect(page.locator('#client-state')).toHaveText('2,2,2')
              await urlSpy.assertSearches(expectedSearches.slice(0, 6))
              await expectNoStitchingError(page)
              await page.locator('#same-tick-overlap').click()
              await expect(page.locator('#client-state')).toHaveText('4,4,4')
              await urlSpy.assertSearches(expectedSearches)
              await expectNoStitchingError(page)
            })

            it('should sequence updates when staggered', async ({ page }) => {
              await navigateTo(page, getUrl(path, { hook, shallow, history }))
              using urlSpy = setupUrlSpy(page)
              await page.locator('#staggered').click()
              await expect(page.locator('#client-state')).toHaveText('1,1,1')
              await urlSpy.assertSearches(expectedSearches.slice(0, 3))
              await expectNoStitchingError(page)
              await page.locator('#staggered').click()
              await expect(page.locator('#client-state')).toHaveText('2,2,2')
              await urlSpy.assertSearches(expectedSearches.slice(0, 6))
              await expectNoStitchingError(page)
              await page.locator('#staggered-overlap').click()
              await expect(page.locator('#client-state')).toHaveText('4,4,4')
              await urlSpy.assertSearches(expectedSearches)
              await expectNoStitchingError(page)
            })
          }
        )
        test({ ...config, hook })
      }
    }
  }
}
