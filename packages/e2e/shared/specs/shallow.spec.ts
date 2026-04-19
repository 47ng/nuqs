import { expect, test as it } from '@playwright/test'
import { defineTest, type TestConfig } from '../define-test'
import { getOptionsUrl } from '../lib/options'
import { navigateTo } from '../playwright/navigate'

type TestShallowOptions = TestConfig & {
  supportsSSR?: boolean
  shallowOptions?: boolean[]
  historyOptions?: ('replace' | 'push')[]
}

export function testShallow({
  supportsSSR = true,
  shallowOptions = [true, false],
  historyOptions = ['replace', 'push'],
  ...options
}: TestShallowOptions) {
  const factory = defineTest('Shallow', ({ path }) => {
    for (const shallow of shallowOptions) {
      for (const history of historyOptions) {
        it(`Updates with ({ shallow: ${shallow}, history: ${history} })`, async ({
          page
        }) => {
          await navigateTo(page, getOptionsUrl(path, { shallow, history }))
          await expect(page.locator('#client-state')).toBeEmpty()
          if (supportsSSR) {
            await expect(page.locator('#server-state')).toBeEmpty()
          }
          await page.locator('button').click()
          await expect(page.locator('#client-state')).toHaveText('pass')
          if (supportsSSR) {
            if (shallow === false) {
              await expect(page.locator('#server-state')).toHaveText('pass')
            } else {
              await expect(page.locator('#server-state')).toBeEmpty()
            }
          }
          if (history !== 'push') {
            return
          }
          await expect(page).toHaveURL(
            url => url.searchParams.get('test') === 'pass'
          )
          await page.goBack()
          await expect(page.locator('#client-state')).toBeEmpty()
          if (supportsSSR) {
            await expect(page.locator('#server-state')).toBeEmpty()
          }
        })
      }
    }
  })
  if (supportsSSR) {
    options.description = 'SSR'
  }
  return factory(options)
}
