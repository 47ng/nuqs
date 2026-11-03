import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('resets query state on App Router navigation with the unified adapter @unified-adapter', async ({
  page
}) => {
  test.skip(
    process.env.NUQS_E2E_UNIFIED_ADAPTER !== 'true',
    'This test requires the unified-adapter build.'
  )
  await navigateTo(page, '/app/navigation-reset/a')
  await expect(page.getByTestId('page-value')).toHaveText('1')

  await page.getByRole('button', { name: 'Set to 2' }).click()
  await expect(page).toHaveURL(
    url =>
      url.pathname === '/app/navigation-reset/a' && url.search === '?page=2'
  )

  await page.getByRole('link', { name: 'Go to page B' }).click()
  await expect(page).toHaveURL('/app/navigation-reset/b')
  await expect(page.getByTestId('page-value')).toHaveText('1')
})
