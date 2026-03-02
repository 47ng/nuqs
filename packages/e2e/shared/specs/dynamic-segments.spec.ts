import { expect, test as it, type Page } from '@playwright/test'
import { defineTest, type TestConfig } from '../define-test'
import { getOptionsUrl } from '../lib/options'
import { navigateTo } from '../playwright/navigate'

type TestDynamicSegmentsOptions = TestConfig & {
  expectedSegments: string[]
}

export function testDynamicSegments({
  expectedSegments,
  ...options
}: TestDynamicSegmentsOptions) {
  async function expectSegments(page: Page, environment: 'client' | 'server') {
    if (expectedSegments.length === 0) {
      await expect(page.locator(`#${environment}-segments`)).toBeEmpty()
    } else {
      await expect(page.locator(`#${environment}-segments`)).toHaveText(
        JSON.stringify(expectedSegments)
      )
    }
  }
  const factory = defineTest('Dynamic segments', ({ path }) => {
    for (const shallow of [true, false]) {
      for (const history of ['replace', 'push'] as const) {
        it(`${path}: Updates with ({ shallow: ${shallow}, history: ${history} })`, async ({
          page
        }) => {
          await navigateTo(page, getOptionsUrl(path, { shallow, history }))
          await expect(page.locator('#client-state')).toBeEmpty()
          await expect(page.locator('#server-state')).toBeEmpty()
          await expectSegments(page, 'server')
          await expectSegments(page, 'client')
          await page.locator('button').click()
          await expect(page.locator('#client-state')).toHaveText('pass')
          await expectSegments(page, 'server')
          await expectSegments(page, 'client')
          if (shallow === false) {
            await expect(page.locator('#server-state')).toHaveText('pass')
          } else {
            await expect(page.locator('#server-state')).toBeEmpty()
          }
          if (history !== 'push') {
            return
          }
          await expect(page).toHaveURL(
            url => url.searchParams.get('test') === 'pass'
          )
          await page.goBack()
          await expect(page.locator('#client-state')).toBeEmpty()
          await expect(page.locator('#server-state')).toBeEmpty()
          await expectSegments(page, 'server')
          await expectSegments(page, 'client')
        })
      }
    }
  })
  return factory(options)
}
