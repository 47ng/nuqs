import { expect, test as it } from '@playwright/test'
import { defineTest, type TestConfig } from '../define-test'
import { expectSearch } from '../playwright/expect-url'
import { navigateTo } from '../playwright/navigate'
import { getUrl } from './popstate-queue-reset.defs'

type TestPopstateQueueResetConfig = TestConfig & {
  otherPath?: string
}

export function testPopstateQueueReset(config: TestPopstateQueueResetConfig) {
  const test = defineTest('Popstate Queue Reset', ({ path }) => {
    const otherPath = config.otherPath ?? path + '/other'

    it('should cancel pending debounced updates when navigating back', async ({
      page
    }) => {
      // Navigate to "other" page first, then to test page
      await navigateTo(page, otherPath)
      await expect(page.locator('#other-page')).toBeVisible()

      // Navigate to test page with long debounce
      await navigateTo(page, getUrl(path, { debounceTime: 500 }))

      // Type to trigger debounced update
      await page.locator('#debounced-input').fill('pending-value')

      // Verify optimistic update shows the value
      await expect(page.locator('#value-display')).toHaveText('pending-value')

      // Navigate back before debounce completes
      await page.goBack()

      // Wait for debounce time to pass
      await page.waitForTimeout(600)

      // Verify we're on the other page and URL is clean
      await expect(page.locator('#other-page')).toBeVisible()
      await expect(page).toHaveURL(url => !url.search.includes('pending-value'))
    })

    it('should not apply old queued updates after back/forward navigation', async ({
      page
    }) => {
      // Navigate to other page first
      await navigateTo(page, otherPath)
      await expect(page.locator('#other-page')).toBeVisible()

      // Navigate to test page with debounce
      await navigateTo(page, getUrl(path, { debounceTime: 400 }))

      // Trigger debounced update
      await page.locator('#debounced-input').fill('old-value')
      await expect(page.locator('#value-display')).toHaveText('old-value')

      // Navigate back before debounce completes
      await page.goBack()
      await expect(page.locator('#other-page')).toBeVisible()

      // Navigate forward - this triggers popstate which should reset queues
      await page.goForward()

      // Clear and enter new value
      await page.locator('#debounced-input').clear()
      await page.locator('#debounced-input').fill('new-value')

      // Wait for debounce to complete
      await page.waitForTimeout(500)

      // Should show ONLY new-value, not old-value
      await expect(page).toHaveURL(url =>
        url.search.includes('value=new-value')
      )
      await expect(page).toHaveURL(url => !url.search.includes('old-value'))
    })

    it('should properly sequence updates after back/forward navigation (mutex reset)', async ({
      page
    }) => {
      // Navigate to other page first
      await navigateTo(page, otherPath)
      await expect(page.locator('#other-page')).toBeVisible()

      // Navigate to test page
      await navigateTo(page, path)

      // Trigger staggered updates to set up some queue state/mutex
      await page.locator('#staggered-updates').click()
      await expect(page.locator('#client-state')).toHaveText('1,1,1')

      // Wait for all updates to complete
      await expectSearch(page, { a: '1', b: '1', c: '1' })

      // Navigate back - this triggers popstate which should reset mutex to 0
      await page.goBack()
      await expect(page.locator('#other-page')).toBeVisible()

      // Navigate forward - another popstate event
      await page.goForward()

      // Wait for page to be ready
      await expect(page.locator('#client-state')).toBeVisible()

      // Trigger fresh staggered updates - these should sequence correctly
      // If mutex was incorrectly reset (e.g., to 1 instead of 0 on popstate),
      // the rate limiting / queue reset behavior would be incorrect
      await page.locator('#staggered-updates').click()
      await expect(page.locator('#client-state')).toHaveText('2,2,2')

      // Verify URL updates sequence correctly
      await expectSearch(page, { a: '2' })
      await expectSearch(page, { a: '2', b: '2' })
      await expectSearch(page, { a: '2', b: '2', c: '2' })
    })

    it('should clear all pending queue updates on popstate', async ({
      page
    }) => {
      // Navigate to other page first
      await navigateTo(page, otherPath)
      await expect(page.locator('#other-page')).toBeVisible()

      // Navigate to test page
      await navigateTo(page, path)

      // Trigger staggered updates (a=immediate, b=250ms, c=500ms)
      await page.locator('#staggered-updates').click()
      await expect(page.locator('#client-state')).toHaveText('1,1,1')

      // Wait for 'a' to be applied but not 'b' or 'c'
      await expectSearch(page, { a: '1' })

      // Navigate back before b and c are applied
      await page.goBack()
      await expect(page.locator('#other-page')).toBeVisible()

      // Wait for what would have been the debounce completion
      await page.waitForTimeout(600)

      // Verify the other page's URL is clean (b and c were not applied)
      await expect(page).toHaveURL(url => !url.search.includes('b='))
      await expect(page).toHaveURL(url => !url.search.includes('c='))
    })

    // This test uses client-side router navigation to ensure
    // the popstate event fires within the same SPA context,
    // which is required to test the queue reset functionality.
    //
    // CRITICAL: This test specifically targets the popstate handler's
    // resetQueues() call. The key scenario is:
    // 1. Trigger ONLY debounced updates (no immediate updates)
    //    - This avoids the onHistoryStateUpdate -> resetQueues flow
    // 2. Navigate via popstate (back/forward) before debounce fires
    // 3. The pending debounced updates should be cancelled by resetQueues() in onPopState
    //
    // Without resetQueues() in onPopState, the debounced updates would fire
    // and modify the URL of the destination page.
    it('should abort pending debounced updates on client-side back navigation', async ({
      page
    }) => {
      // Log console messages for debugging
      page.on('console', msg => {
        if (msg.text().includes('nuqs')) {
          console.log('BROWSER:', msg.text())
        }
      })

      // Start on the test page
      await navigateTo(page, path)
      await expect(page.locator('#client-state')).toBeVisible()

      // Use client-side navigation to go to "other" page first
      // This creates a history entry within the SPA context
      await page.locator('#navigate-to-other').click()
      await expect(page.locator('#other-page')).toBeVisible()

      // Navigate back to test page using browser back button (popstate)
      await page.goBack()
      await expect(page.locator('#client-state')).toBeVisible()

      // Trigger ONLY debounced updates (b=300ms, c=500ms)
      // No immediate update, so no history calls, so no onHistoryStateUpdate
      await page.locator('#debounced-only').click()

      // Verify optimistic state shows the updates
      await expect(page.locator('#client-state')).toHaveText('0,1,1')

      // Navigate forward to other page IMMEDIATELY (before any debounce fires)
      // This is a popstate event, which should trigger resetQueues() in onPopState
      await page.goForward()
      await expect(page.locator('#other-page')).toBeVisible()

      // Wait for what would have been the debounce completion
      await page.waitForTimeout(600)

      // If resetQueues() was called on popstate, b and c should be aborted
      // and NOT appear in the URL.
      // If resetQueues() was NOT called (mutation), b and c would be applied
      // to the current URL (other page's URL).
      await expect(page).toHaveURL(url => !url.search.includes('b='))
      await expect(page).toHaveURL(url => !url.search.includes('c='))
    })
  })

  test(config)
}
