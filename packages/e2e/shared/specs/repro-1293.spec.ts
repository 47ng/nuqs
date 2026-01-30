import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { assertLogCount, setupLogSpy } from '../playwright/log-spy'
import { navigateTo } from '../playwright/navigate'

export const testRepro1293 = defineTest('repro-1293', ({ path }) => {
  it('should not re-render the source page with target search params when navigating to another page', async ({
    page
  }) => {
    using logSpy = setupLogSpy(page)
    // Navigate to Page A
    await navigateTo(page, path + '/a')

    // Navigate to Page B
    logSpy.logs.length = 0 // Clear logs
    await page.getByRole('link', { name: 'Go to Page B' }).click()
    await expect(page).toHaveURL(`${path}/b?count=1`)
    await assertLogCount(
      logSpy,
      'a: 1',
      0,
      'should not re-render Page A when navigating to Page B'
    )

    // Navigate back to Page A
    logSpy.logs.length = 0 // Clear logs
    await page.getByRole('button', { name: 'Go back' }).click()
    await expect(page).toHaveURL(`${path}/a`)
    await assertLogCount(
      logSpy,
      'b: 0',
      0,
      'should not re-render Page B when navigating back to Page A'
    )
  })
})
