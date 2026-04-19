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
    await expect(page).toHaveURL(
      url =>
        url.pathname.endsWith(`${path}/b`) && // support basePath
        url.searchParams.get('count') === '1'
    )
    await assertLogCount(
      logSpy,
      'a: 1',
      0,
      'should not re-render Page A when navigating to Page B'
    )

    // Navigate back to Page A
    logSpy.logs.length = 0 // Clear logs
    await page.getByRole('button', { name: 'Go back' }).click()
    await expect(page).toHaveURL(
      url =>
        url.pathname.endsWith(`${path}/a`) && // support basePath
        url.searchParams.get('count') === null
    )
    await assertLogCount(
      logSpy,
      'b: 0',
      0,
      'should not re-render Page B when navigating back to Page A'
    )
  })

  it('should not pre-render the target page with source search params when navigating to another page after a nuqs state update', async ({
    page
  }) => {
    using logSpy = setupLogSpy(page)
    // Navigate to Page A
    await navigateTo(page, path + '/a')

    // Increment count to 1
    logSpy.logs.length = 0 // Clear logs
    await page.getByRole('button', { name: 'Increment' }).click()
    await expect(page).toHaveURL(
      url =>
        url.pathname.endsWith(`${path}/a`) && // support basePath
        url.searchParams.get('count') === '1'
    )

    // Navigate to Page B
    logSpy.logs.length = 0 // Clear logs
    await page.getByRole('link', { name: 'Go to Page B' }).click()
    await expect(page).toHaveURL(
      url =>
        url.pathname.endsWith(`${path}/b`) && // support basePath
        url.searchParams.get('count') === '2'
    )
    await assertLogCount(
      logSpy,
      'a: 2',
      0,
      'should not re-render Page A when navigating to Page B after a nuqs state update'
    )
    await assertLogCount(
      logSpy,
      'b: 1',
      0,
      'should not pre-render Page B with pre-navigation search params'
    )

    // Increment on page B
    logSpy.logs.length = 0 // Clear logs
    await page.getByRole('button', { name: 'Increment' }).click()
    await expect(page).toHaveURL(
      url =>
        url.pathname.endsWith(`${path}/b`) && // support basePath
        url.searchParams.get('count') === '3'
    )

    // Go back to Page A
    logSpy.logs.length = 0 // Clear logs
    await page.getByRole('button', { name: 'Go back' }).click()
    await expect(page).toHaveURL(
      url =>
        url.pathname.endsWith(`${path}/a`) && // support basePath
        url.searchParams.get('count') === '1'
    )
    await assertLogCount(
      logSpy,
      'a: 3',
      0,
      'should not pre-render Page A when navigating back after a nuqs state update'
    )
  })
})
