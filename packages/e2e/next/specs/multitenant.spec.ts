import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'
import { createSerializer, parseAsBoolean, parseAsStringLiteral } from 'nuqs'

const getUrl = createSerializer({
  shallow: parseAsBoolean.withDefault(true),
  history: parseAsStringLiteral(['replace', 'push']).withDefault('replace')
})

type Config = {
  path: string
  router: 'next-app' | 'next-pages'
  expectedPathname: string
}

function testMultitenant(config: Config) {
  const shallows = [true, false]
  const histories = ['replace', 'push'] as const

  for (const shallow of shallows) {
    for (const history of histories) {
      test.describe(`Multitenant - ${config.router} - shallow: ${shallow}, history: ${history}`, () => {
        test(`Updates with ({ shallow: ${shallow}, history: ${history} })`, async ({
          page
        }) => {
          await navigateTo(page, getUrl(config.path, { shallow, history }))
          await expect(page.locator('#client-state')).toBeEmpty()
          await expect(page.locator('#server-state')).toBeEmpty()
          await expect(page.locator('#client-tenant')).toHaveText('david')
          await expect(page.locator('#server-tenant')).toHaveText('david')
          await expect(page.locator('#router-pathname')).toHaveText(
            config.expectedPathname
          )
          await page.locator('button').click()
          await expect(page.locator('#client-state')).toHaveText('pass')
          await expect(page.locator('#client-tenant')).toHaveText('david')
          await expect(page.locator('#server-tenant')).toHaveText('david')
          await expect(page.locator('#router-pathname')).toHaveText(
            config.expectedPathname
          )
          if (shallow === false) {
            await expect(page.locator('#server-state')).toHaveText('pass')
          } else {
            await expect(page.locator('#server-state')).toBeEmpty()
          }
          if (history !== 'push') {
            return
          }
          await page.goBack()
          await expect(page.locator('#client-tenant')).toHaveText('david')
          await expect(page.locator('#server-tenant')).toHaveText('david')
          await expect(page.locator('#client-state')).toBeEmpty()
          await expect(page.locator('#server-state')).toBeEmpty()
          await expect(page.locator('#router-pathname')).toHaveText(
            config.expectedPathname
          )
        })
      })
    }
  }
}

testMultitenant({
  path: '/app/multitenant',
  router: 'next-app',
  expectedPathname: '/app/multitenant'
})

testMultitenant({
  path: '/pages/multitenant',
  router: 'next-pages',
  expectedPathname: '/pages/multitenant/[tenant]'
})
