// Regression test for https://github.com/47ng/nuqs/issues/1590
//
// On a route with a dynamic path segment, a nuqs-driven URL update used to
// produce a doubled, malformed query string (the route's own `validateSearch`
// defaults got appended after nuqs's own query string). See
// src/routes/repro-1590.$table.tsx for the detailed root cause.
import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('does not double the query string on a route with a dynamic segment', async ({
  page
}) => {
  await navigateTo(
    page,
    '/repro-1590/customers',
    '?schema=public&limit=25&view=data'
  )
  await expect(page.locator('#table')).toHaveText('customers')
  await expect(page.locator('#view')).toHaveText('data')

  await page.getByText('Set view=structure').click()

  await expect(page.locator('#view')).toHaveText('structure')
  // The bug produced:
  // ?schema=public&limit=25&view=structure?schema=public&limit=50&view=data
  // A correct, single query string keeps `limit=25` (the value on screen)
  // and doesn't contain a second `?`.
  await expect(page).toHaveURL(
    url => url.search === '?schema=public&limit=25&view=structure'
  )
  const fullUrl = page.url()
  expect(fullUrl.indexOf('?')).toBe(fullUrl.lastIndexOf('?'))
})
