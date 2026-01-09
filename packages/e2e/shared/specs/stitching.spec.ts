import { expect, test as it } from '@playwright/test'
import { defineTest, type TestConfig } from '../define-test'
import { expectSearch } from '../playwright/expect-url'
import { navigateTo } from '../playwright/navigate'
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
          ({ path, isHashRouter }) => {
            it('should update the state optimistically and sequence the URL updates', async ({
              page
            }) => {
              await navigateTo(
                page,
                getUrl(path, { hook, shallow, history }),
                '',
                { isHashRouter }
              )
              await page.locator('#same-tick').click()
              await expect(page.locator('#client-state')).toHaveText('1,1,1')
              await expectSearch(page, { a: '1' }, isHashRouter)
              await expectSearch(page, { a: '1', b: '1' }, isHashRouter)
              await expectSearch(page, { a: '1', b: '1', c: '1' }, isHashRouter)
              await page.locator('#same-tick').click()
              await expect(page.locator('#client-state')).toHaveText('2,2,2')
              await expectSearch(page, { a: '2', b: '1', c: '1' }, isHashRouter)
              await expectSearch(page, { a: '2', b: '2', c: '1' }, isHashRouter)
              await expectSearch(page, { a: '2', b: '2', c: '2' }, isHashRouter)
              await page.locator('#same-tick').click()
              await expect(page.locator('#client-state')).toHaveText('3,3,3')
              await expectSearch(page, { a: '3', b: '2', c: '2' }, isHashRouter)
              // Don't wait till completion, queue an update before the debounced resolve
              await page.locator('#same-tick').click()
              await expect(page.locator('#client-state')).toHaveText('4,4,4')
              await expectSearch(page, { a: '4', b: '2', c: '2' }, isHashRouter)
              await expectSearch(page, { a: '4', b: '4', c: '2' }, isHashRouter)
              await expectSearch(page, { a: '4', b: '4', c: '4' }, isHashRouter)
            })

            it('should sequence updates when staggered', async ({ page }) => {
              await navigateTo(
                page,
                getUrl(path, { hook, shallow, history }),
                '',
                { isHashRouter }
              )
              await page.locator('#staggered').click()
              await expect(page.locator('#client-state')).toHaveText('1,1,1')
              await expectSearch(page, { a: '1' }, isHashRouter)
              await expectSearch(page, { a: '1', b: '1' }, isHashRouter)
              await expectSearch(page, { a: '1', b: '1', c: '1' }, isHashRouter)
              await page.locator('#staggered').click()
              await expect(page.locator('#client-state')).toHaveText('2,2,2')
              await expectSearch(page, { a: '2', b: '1', c: '1' }, isHashRouter)
              await expectSearch(page, { a: '2', b: '2', c: '1' }, isHashRouter)
              await expectSearch(page, { a: '2', b: '2', c: '2' }, isHashRouter)
              await page.locator('#staggered').click()
              await expect(page.locator('#client-state')).toHaveText('3,3,3')
              await expectSearch(page, { a: '3', b: '2', c: '2' }, isHashRouter)
              // Don't wait till completion, queue an update before the debounced resolve
              await page.locator('#staggered').click()
              await expect(page.locator('#client-state')).toHaveText('4,4,4')
              await expectSearch(page, { a: '4', b: '2', c: '2' }, isHashRouter)
              await expectSearch(page, { a: '4', b: '4', c: '2' }, isHashRouter)
              await expectSearch(page, { a: '4', b: '4', c: '4' }, isHashRouter)
            })
          }
        )
        test({ ...config, hook })
      }
    }
  }
}
