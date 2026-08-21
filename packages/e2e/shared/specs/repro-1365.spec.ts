import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { assertLogCount, setupLogSpy } from '../playwright/log-spy'
import { navigateTo } from '../playwright/navigate'

export const testRepro1365 = defineTest('repro-1365', ({ path }) => {
  it('should not cause extra effect fires when updating state in useEffect', async ({
    page
  }) => {
    using logSpy = setupLogSpy(page)
    await navigateTo(page, path)

    // Wait for mount effect to settle:
    // initial b=0, effect fires once on mount -> b=1
    await assertLogCount(logSpy, 'effect', 1)
    await expect(page.locator('#b')).toHaveText('1')

    // Clear logs after mount settles
    logSpy.logs.length = 0

    // Click toggle: a changes false -> true
    await page.getByRole('button', { name: 'toggle' }).click()

    // Wait for b to update in the URL (proves the effect has run and flushed)
    await expect(page).toHaveURL(
      url =>
        url.searchParams.get('a') === 'true' &&
        url.searchParams.get('b') === '2'
    )

    // The effect should have fired exactly once for the a change.
    // With the bug (flash to default), the effect fires extra times
    // and b ends up higher than 2.
    await expect(page.locator('#b')).toHaveText('2')
    await assertLogCount(
      logSpy,
      'effect',
      1,
      'effect should fire exactly once when a changes'
    )
  })
})
