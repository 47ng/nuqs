import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { assertLogCount, setupLogSpy } from '../playwright/log-spy'
import { navigateTo } from '../playwright/navigate'

export const testRepro1444 = defineTest('repro-1444', ({ path }) => {
  it('should not render a stale value when an Activity wrapper becomes visible', async ({
    page
  }) => {
    using logSpy = setupLogSpy(page)
    await navigateTo(page, path)

    const input = page.getByRole('textbox', { name: 'name' })
    const toggle = page.getByRole('button', { name: 'toggle visibility' })

    // 1. Set an initial value while the Activity child is visible.
    await input.fill('stale-value')
    await expect(page).toHaveURL(
      url => url.searchParams.get('name') === 'stale-value'
    )
    await expect(page.locator('#client-state')).toHaveText('stale-value')

    // 2. Hide the Activity. Its child keeps the "stale-value" snapshot.
    await toggle.click()

    // 3. Change the value while hidden: the visible reader (the input) updates,
    //    but the hidden child does not react to the URL change.
    await input.fill('fresh-value')
    await expect(page).toHaveURL(
      url => url.searchParams.get('name') === 'fresh-value'
    )

    // 4. Reveal the Activity. The child must commit the current value directly,
    //    never painting the stale snapshot it held while hidden.
    logSpy.logs.length = 0
    await toggle.click()
    await expect(page.locator('#client-state')).toHaveText('fresh-value')
    await assertLogCount(
      logSpy,
      'commit: stale-value',
      0,
      'Activity child should not paint the stale value when revealed'
    )
  })
})
