import { expect, test as it } from '@playwright/test'
import { defineTest, type TestConfig } from '../define-test'
import { navigateTo } from '../playwright/navigate'
import { getRoutingUrl } from './routing.defs'

type TestRoutingOptions = TestConfig & {
  shallowOptions?: boolean[]
  methodOptions?: ('replace' | 'push')[]
}

export function testRouting({
  shallowOptions = [true, false],
  methodOptions = ['replace', 'push'],
  ...options
}: TestRoutingOptions) {
  const factory = defineTest('Routing', ({ path }) => {
    for (const shallow of shallowOptions) {
      for (const method of methodOptions) {
        it(`picks up state from a router call pointing to the same page - router.${method}({ shallow: ${shallow} })`, async ({
          page
        }) => {
          await navigateTo(page, getRoutingUrl(path, { shallow, method }))
          await expect(page.locator('#state')).toBeEmpty()
          await page.locator('button').click()
          await expect(page.locator('#state')).toHaveText('pass')
          if (method === 'push') {
            await page.goBack()
            await expect(page.locator('#state')).toBeEmpty()
          }
        })

        it(`picks up state from a router issued from another page - router.${method}({ shallow: ${shallow} })`, async ({
          page
        }) => {
          await navigateTo(
            page,
            getRoutingUrl(path + '/other', { shallow, method })
          )
          await expect(page.locator('#state')).toBeEmpty()
          await page.locator('button').click()
          await expect(page.locator('#state')).toHaveText('pass')
          if (method === 'push') {
            await page.goBack()
            await expect(page.locator('#state')).toBeEmpty()
          }
        })
      }
    }
  })
  return factory(options)
}
