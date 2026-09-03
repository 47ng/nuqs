import { expect, test } from '@playwright/test'
import { expectUrl } from 'e2e-shared/playwright/expect-url.ts'
import { assertLogCount, setupLogSpy } from 'e2e-shared/playwright/log-spy.ts'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('a cached memoized page reads its Back destination before committing', async ({
  page
}) => {
  test.skip(
    process.env.CACHE_COMPONENTS !== 'true',
    'requires Next.js Cache Components'
  )
  using logSpy = setupLogSpy(page)
  const path = '/app/key-isolation/activity-reveal/a'
  const value = page.locator('#activity-value')
  const retained = page.locator('#client-activity-retained')

  await navigateTo(page, path, '?name=fresh-value')
  await expect(value).toHaveText('fresh-value')
  await page.getByRole('button', { name: 'Mark retained' }).click()
  await expect(retained).toHaveText('true')

  await page.getByRole('button', { name: 'Set stale' }).click()
  await expectUrl(page, url => url.searchParams.get('name') === 'stale-value')
  await expect(value).toHaveText('stale-value')

  await page.getByRole('link', { name: 'Go to B' }).click()
  await expectUrl(
    page,
    url =>
      url.pathname.endsWith('/activity-reveal/b') &&
      url.searchParams.get('name') === 'stale-value'
  )
  await expect(value).toHaveCount(1)
  await expect(value).toBeHidden()
  await expect(value).toHaveText('stale-value')
  await expect(retained).toBeHidden()
  await expect(retained).toHaveText('true')

  logSpy.logs.length = 0
  await page.goBack()
  await expectUrl(
    page,
    url =>
      url.pathname.endsWith('/activity-reveal/a') &&
      url.searchParams.get('name') === 'fresh-value'
  )
  await expect
    .poll(
      () =>
        logSpy.logs.filter(line => line === 'activity commit: fresh-value')
          .length
    )
    .toBeGreaterThan(0)
  await expect(value).toBeVisible()
  await expect(value).toHaveText('fresh-value')
  await expect(retained).toBeVisible()
  await expect(retained).toHaveText('true')
  await assertLogCount(
    logSpy,
    'activity commit: stale-value',
    0,
    'retained page must not commit its stale snapshot when revealed'
  )
})
