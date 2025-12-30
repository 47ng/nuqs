import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('Supports rewrites (server-side only)', async ({ page }) => {
  await navigateTo(page, '/app/rewrites/source', '?through=original')
  await expect(page.locator('#injected-server')).toHaveText('by rewrites')
  await expect(page.locator('#injected-client')).toHaveText('null')
  await expect(page.locator('#through-server')).toHaveText('original')
  await expect(page.locator('#through-client')).toHaveText('original')

  await navigateTo(page, '/app/rewrites/source', '?injected=original')
  await expect(page.locator('#injected-server')).toHaveText('by rewrites')
  await expect(page.locator('#injected-client')).toHaveText('original')

  await navigateTo(page, '/app/rewrites/source/match-query', '?injected=blocked')
  await expect(page.locator('#injected-server')).toHaveText('disallowed')
  await expect(page.locator('#injected-client')).toHaveText('blocked')
})
