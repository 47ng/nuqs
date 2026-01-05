import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { createSearchMatcher } from '../playwright/expect-url'
import { assertLogCount, setupLogSpy } from '../playwright/log-spy'
import { navigateTo } from '../playwright/navigate'

export const testKeyIsolation = defineTest(
  'Key isolation',
  ({ path, isHashRouter }) => {
    it('does not render b when updating a', async ({ page }) => {
      using logSpy = setupLogSpy(page)
      await navigateTo(page, path, '', { isHashRouter })
      await page.locator('#trigger-a').click()
      await expect(page.locator('#state-a')).toHaveText('pass')
      await expect(page).toHaveURL(
        createSearchMatcher('?a=pass', isHashRouter ?? false)
      )
      await assertLogCount(logSpy, 'render a', 3) // 1 at mount + 2 at update
      await assertLogCount(logSpy, 'render b', 1) // only 1 at mount
    })

    it('does not render a when updating b', async ({ page }) => {
      using logSpy = setupLogSpy(page)
      await navigateTo(page, path, '', { isHashRouter })
      await page.locator('#trigger-b').click()
      await expect(page.locator('#state-b')).toHaveText('pass')
      await expect(page).toHaveURL(
        createSearchMatcher('?b=pass', isHashRouter ?? false)
      )
      await assertLogCount(logSpy, 'render b', 3) // 1 at mount + 2 at update
      await assertLogCount(logSpy, 'render a', 1) // only 1 at mount
    })

    it('does not render a again when updating b after a', async ({ page }) => {
      using logSpy = setupLogSpy(page)
      await navigateTo(page, path, '', { isHashRouter })
      await page.locator('#trigger-a').click()
      await expect(page.locator('#state-a')).toHaveText('pass')
      await page.locator('#trigger-b').click()
      await expect(page.locator('#state-b')).toHaveText('pass')
      await expect(page).toHaveURL(
        createSearchMatcher('?a=pass&b=pass', isHashRouter ?? false)
      )
      await assertLogCount(logSpy, 'render a', 3) // 1 at mount + 2 at update
      await assertLogCount(logSpy, 'render b', 3) // 1 at mount + 2 at update
    })
  }
)
