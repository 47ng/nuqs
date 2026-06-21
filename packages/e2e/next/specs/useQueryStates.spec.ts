import { expect, test, type Page } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

async function runTest(page: Page) {
  await expect(page.locator('#json')).toHaveText(
    '{"string":null,"int":null,"float":null,"index":null,"bool":null}'
  )
  await expect(page.locator('#string')).toBeEmpty()
  await expect(page.locator('#int')).toBeEmpty()
  await expect(page.locator('#float')).toBeEmpty()
  await expect(page.locator('#index')).toBeEmpty()
  await expect(page.locator('#bool')).toBeEmpty()
  await expect(page).toHaveURL(url => url.search === '')

  await page.getByText('Set string').click()
  await expect(page).toHaveURL(url => url.search === '?string=Hello')
  await expect(page.locator('#string')).toHaveText('Hello')
  await expect(page.locator('#json')).toHaveText(
    '{"string":"Hello","int":null,"float":null,"index":null,"bool":null}'
  )

  await page.getByText('Set int').click()
  await expect(page).toHaveURL(url => url.search.includes('int=42'))
  await expect(page.locator('#int')).toHaveText('42')
  await expect(page.locator('#json')).toHaveText(
    '{"string":"Hello","int":42,"float":null,"index":null,"bool":null}'
  )

  await page.getByText('Set float').click()
  await expect(page).toHaveURL(url => url.search.includes('float=3.14159'))
  await expect(page.locator('#float')).toHaveText('3.14159')
  await expect(page.locator('#json')).toHaveText(
    '{"string":"Hello","int":42,"float":3.14159,"index":null,"bool":null}'
  )

  await page.getByText('Set index').click()
  await expect(page).toHaveURL(url => url.search.includes('index=9'))
  await expect(page.locator('#index')).toHaveText('8')
  await expect(page.locator('#json')).toHaveText(
    '{"string":"Hello","int":42,"float":3.14159,"index":8,"bool":null}'
  )

  await page.getByText('Toggle bool').click()
  await expect(page).toHaveURL(url => url.search.includes('bool=true'))
  await expect(page.locator('#bool')).toHaveText('true')
  await expect(page.locator('#json')).toHaveText(
    '{"string":"Hello","int":42,"float":3.14159,"index":8,"bool":true}'
  )

  await page.getByText('Toggle bool').click()
  await expect(page).toHaveURL(url => url.search.includes('bool=false'))
  await expect(page.locator('#bool')).toHaveText('false')
  await expect(page.locator('#json')).toHaveText(
    '{"string":"Hello","int":42,"float":3.14159,"index":8,"bool":false}'
  )

  await page.locator('#clear-string').click()
  await expect(page).toHaveURL(url => !url.search.includes('string=Hello'))
  await expect(page.locator('#string')).toBeEmpty()
  await expect(page.locator('#json')).toHaveText(
    '{"string":null,"int":42,"float":3.14159,"index":8,"bool":false}'
  )

  await page.locator('#clear').click()
  await expect(page).toHaveURL(url => !url.search.includes('string'))
  await expect(page).toHaveURL(url => !url.search.includes('int'))
  await expect(page).toHaveURL(url => !url.search.includes('float'))
  await expect(page).toHaveURL(url => !url.search.includes('index'))
  await expect(page).toHaveURL(url => !url.search.includes('bool'))
  await expect(page.locator('#json')).toHaveText(
    '{"string":null,"int":null,"float":null,"index":null,"bool":null}'
  )
  await expect(page.locator('#string')).toBeEmpty()
  await expect(page.locator('#int')).toBeEmpty()
  await expect(page.locator('#float')).toBeEmpty()
  await expect(page.locator('#index')).toBeEmpty()
  await expect(page.locator('#bool')).toBeEmpty()
  await expect(page).toHaveURL(url => url.search === '')
}

test.describe('useQueryStates (app router)', () => {
  test('uses string by default', async ({ page }) => {
    await navigateTo(page, '/app/useQueryStates')
    await runTest(page)
  })

  test('should work with dynamic routes', async ({ page }) => {
    await navigateTo(page, '/app/useQueryStates/dynamic/route')
    await runTest(page)
  })
})

test.describe('useQueryStates (pages router)', () => {
  test('uses string by default', async ({ page }) => {
    await navigateTo(page, '/pages/useQueryStates')
    await runTest(page)
  })

  test('should work with dynamic routes', async ({ page }) => {
    await navigateTo(page, '/pages/useQueryStates/dynamic/route')
    await runTest(page)
  })
})
