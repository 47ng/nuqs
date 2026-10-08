import { expect, test as it } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'
import { testPush } from 'e2e-shared/specs/push.spec.ts'

testPush({
  path: '/push/useQueryState',
  hook: 'useQueryState'
})

testPush({
  path: '/push/useQueryStates',
  hook: 'useQueryStates'
})

for (const hook of ['useQueryState', 'useQueryStates'] as const) {
  it(`preserves application history state through push and traversal (${hook})`, async ({
    page
  }) => {
    await navigateTo(page, `/push/${hook}`, '?test=init')
    const applicationState = { idx: 42, custom: 'app' }
    await page.evaluate(state => {
      history.replaceState(state, '', location.href)
    }, applicationState)

    await page.getByRole('button', { name: 'Test', exact: true }).click()
    await expect(page).toHaveURL(url => url.search === '?test=pass')
    expect(await page.evaluate(() => history.state)).toEqual(applicationState)

    await page.goBack()
    await expect(page.locator('#state')).toHaveText('init')
    expect(await page.evaluate(() => history.state)).toEqual(applicationState)

    await page.goForward()
    await expect(page.locator('#state')).toHaveText('pass')
    expect(await page.evaluate(() => history.state)).toEqual(applicationState)
  })
}
