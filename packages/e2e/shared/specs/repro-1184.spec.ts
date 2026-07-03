import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { setupLogSpy } from '../playwright/log-spy'
import { navigateTo } from '../playwright/navigate'

export const testRepro1184 = defineTest('repro-1184', ({ path }) => {
  it('keeps the transition pending until the loader has settled', async ({
    page
  }) => {
    using logSpy = setupLogSpy(page)
    await navigateTo(page, path)
    await expect(page.locator('#server-counter')).toHaveText('0')

    logSpy.logs.length = 0
    await page.getByRole('button', { name: 'Increment' }).click()
    await expect(page.locator('#client-counter')).toHaveText('1')
    await expect(page.locator('#server-counter')).toHaveText('1')

    const commits = logSpy.logs.filter(log => log.startsWith('repro-1184'))
    const firstPending = commits.findIndex(log => log.includes('loading:true'))
    expect(
      firstPending,
      'the transition should become pending while the loader runs'
    ).not.toBe(-1)
    const pendingDroppedEarly = commits
      .slice(firstPending)
      .filter(log => log.includes('loading:false') && log.includes('server:0'))
    expect(
      pendingDroppedEarly,
      'the transition should stay pending until the loader returns fresh data'
    ).toEqual([])
  })
})
