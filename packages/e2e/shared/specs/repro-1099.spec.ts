import { expect, test as it } from '@playwright/test'
import { defineTest, type TestConfig } from '../define-test'
import { getOptionsUrl } from '../lib/options'
import { navigateTo } from '../playwright/navigate'

type TestRepro1099Options = TestConfig & {
  shallowOptions?: boolean[]
  historyOptions?: ('replace' | 'push')[]
}

export function testRepro1099({
  shallowOptions = [true, false],
  historyOptions = ['replace', 'push'],
  ...options
}: TestRepro1099Options) {
  const factory = defineTest('repro-1099', ({ path }) => {
    for (const shallow of shallowOptions) {
      for (const history of historyOptions) {
        it(`should not emit null during updates with { shallow: ${shallow}, history: '${history}' }`, async ({
          page
        }) => {
          await navigateTo(page, getOptionsUrl(path, { history, shallow }))
          await expect(page.locator('#null-detector')).toHaveText('pass')
          await page.locator('button').click()
          await expect(page).toHaveURL(url => url.search.endsWith('test=pass'))
          await expect(page.locator('#null-detector')).toHaveText('pass')
        })
      }
    }
  })
  return factory(options)
}
