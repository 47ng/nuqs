import { expect, test as it, type Page } from '@playwright/test'
import { defineTest, type TestConfig } from '../define-test'
import { navigateTo } from '../playwright/navigate'
import { setupUrlSpy } from '../playwright/url-spy'
import { getUrl } from './stitching.defs'

type Config = TestConfig & {
  enableShallowFalse?: boolean
}

export function testStitching({
  enableShallowFalse = true,
  ...config
}: Config) {
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
              await urlSpy.assertSearches([
                { a: '1' },
                { a: '1', b: '1' },
                { a: '1', b: '1', c: '1' }
              ])
              // await assertSearch(page, { a: '1' })
              // await assertSearch(page, { a: '1', b: '1' })
              // await assertSearch(page, { a: '1', b: '1', c: '1' })
              urlSpy.reset()
              await page.locator('#same-tick').click()
              await expect(page.locator('#client-state')).toHaveText('2,2,2')
              await urlSpy.assertSearches([
                { a: '2', b: '1', c: '1' },
                { a: '2', b: '2', c: '1' },
                { a: '2', b: '2', c: '2' }
              ])
              // await assertSearch(page, { a: '2', b: '1', c: '1' })
              // await assertSearch(page, { a: '2', b: '2', c: '1' })
              // await assertSearch(page, { a: '2', b: '2', c: '2' })
              urlSpy.reset()
              // await page.locator('#same-tick').click()
              // await expect(page.locator('#client-state')).toHaveText('3,3,3')
              // await urlSpy.assertSearches([{ a: '3', b: '2', c: '2' }])
              // // Don't wait till completion, queue an update before the debounced resolve
              // urlSpy.reset()
              // await page.locator('#same-tick').click()
              // await expect(page.locator('#client-state')).toHaveText('4,4,4')
              // await urlSpy.assertSearches([
              //   { a: '4', b: '2', c: '2' },
              //   { a: '4', b: '4', c: '2' },
              //   { a: '4', b: '4', c: '4' }
              // ])
            })

            it('should sequence updates when staggered', async ({ page }) => {
              await navigateTo(page, getUrl(path, { hook, shallow, history }))
              await page.locator('#staggered').click()
              await expect(page.locator('#client-state')).toHaveText('1,1,1')
              await assertSearch(page, { a: '1' })
              await assertSearch(page, { a: '1', b: '1' })
              await assertSearch(page, { a: '1', b: '1', c: '1' })
              await page.locator('#staggered').click()
              await expect(page.locator('#client-state')).toHaveText('2,2,2')
              await assertSearch(page, { a: '2', b: '1', c: '1' })
              await assertSearch(page, { a: '2', b: '2', c: '1' })
              await assertSearch(page, { a: '2', b: '2', c: '2' })
              await page.locator('#staggered').click()
              await expect(page.locator('#client-state')).toHaveText('3,3,3')
              await assertSearch(page, { a: '3', b: '2', c: '2' })
              // Don't wait till completion, queue an update before the debounced resolve
              await page.locator('#staggered').click()
              await expect(page.locator('#client-state')).toHaveText('4,4,4')
              await assertSearch(page, { a: '4', b: '2', c: '2' })
              await assertSearch(page, { a: '4', b: '4', c: '2' })
              await assertSearch(page, { a: '4', b: '4', c: '4' })
            })
          }
        )
        test({ ...config, hook })
      }
    }
  }
}

function assertSearch(page: Page, test: Record<string, string>) {
  return expect(page).toHaveURL(url =>
    Object.entries(test).every(
      ([key, value]) => url.searchParams.get(key) === value
    )
  )
}
