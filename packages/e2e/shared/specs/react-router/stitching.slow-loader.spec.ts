import { expect, test as it } from '@playwright/test'
import { defineTest } from '../../define-test'
import { expectSearch, expectUrl } from '../../playwright/expect-url'
import { readHistoryIndex } from '../../playwright/history'
import { navigateTo } from '../../playwright/navigate'
import { getUrl } from '../stitching.defs'

export const testStitchingSlowLoader = defineTest(
  'Stitching - slow loader',
  ({ path }) => {
    for (const hook of ['useQueryState', 'useQueryStates'] as const) {
      it(`keeps stitching updates while a deep push loader is pending (${hook})`, async ({
        page
      }) => {
        await navigateTo(
          page,
          getUrl(path, { hook, shallow: false, history: 'push', delay: 1000 })
        )
        const initialIndex = await readHistoryIndex(page)
        await page.locator('#same-tick').click()
        await expect(page.locator('#client-state')).toHaveText('1,1,1')
        await expectSearch(page, { a: '1' })
        await expectSearch(page, { a: '1', b: '1' })
        await expectSearch(page, { a: '1', b: '1', c: '1' })
        await expect.poll(() => readHistoryIndex(page)).toBe(initialIndex + 1)
        await expect(page.locator('#client-state')).toHaveText('1,1,1')
        await expectSearch(page, { a: '1', b: '1', c: '1' })
        await page.goBack()
        await expect(page.locator('#client-state')).toHaveText('0,0,0')
        await expectUrl(page, url => !url.searchParams.has('a'))
        expect(await readHistoryIndex(page)).toBe(initialIndex)
        await page.goForward()
        await expect(page.locator('#client-state')).toHaveText('1,1,1')
        await expectSearch(page, { a: '1', b: '1', c: '1' })
        expect(await readHistoryIndex(page)).toBe(initialIndex + 1)
      })
    }
  }
)
