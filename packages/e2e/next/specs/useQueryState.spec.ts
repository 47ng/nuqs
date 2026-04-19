import { expect, test, type Page } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

async function runTest(page: Page, pathname: string) {
  // String
  await expect(page.locator('#string_value')).toBeEmpty()
  await page.locator('#string_set_a').click()
  await expect(page).toHaveURL(url => url.pathname === pathname)
  await expect(page).toHaveURL(url => url.search === '?string=a')
  await expect(page.locator('#string_value')).toHaveText('a')
  await page.locator('#string_set_b').click()
  await expect(page).toHaveURL(url => url.pathname === pathname)
  await expect(page).toHaveURL(url => url.search === '?string=b')
  await expect(page.locator('#string_value')).toHaveText('b')
  await page.locator('#string_clear').click()
  await expect(page).toHaveURL(url => url.pathname === pathname)
  await expect(page).toHaveURL(url => url.search === '')
  await expect(page.locator('#string_value')).toBeEmpty()

  // Integer
  await expect(page.locator('#int_value')).toBeEmpty()
  await page.locator('#int_increment').click()
  await expect(page).toHaveURL(url => url.search === '?int=1')
  await expect(page.locator('#int_value')).toHaveText('1')
  await page.locator('#int_increment').click()
  await expect(page).toHaveURL(url => url.search === '?int=2')
  await expect(page.locator('#int_value')).toHaveText('2')
  await page.locator('#int_decrement').click()
  await expect(page).toHaveURL(url => url.search === '?int=1')
  await expect(page.locator('#int_value')).toHaveText('1')
  await page.locator('#int_decrement').click()
  await expect(page).toHaveURL(url => url.search === '?int=0')
  await expect(page.locator('#int_value')).toHaveText('0')
  await page.locator('#int_decrement').click()
  await expect(page).toHaveURL(url => url.search === '?int=-1')
  await expect(page.locator('#int_value')).toHaveText('-1')
  await page.locator('#int_clear').click()
  await expect(page).toHaveURL(url => url.search === '')
  await expect(page.locator('#int_value')).toBeEmpty()

  // Float
  await expect(page.locator('#float_value')).toBeEmpty()
  await page.locator('#float_increment').click()
  await expect(page).toHaveURL(url => url.search === '?float=0.1')
  await expect(page.locator('#float_value')).toHaveText('0.1')
  await page.locator('#float_increment').click()
  await expect(page).toHaveURL(url => url.search === '?float=0.2')
  await expect(page.locator('#float_value')).toHaveText('0.2')
  await page.locator('#float_decrement').click()
  await expect(page).toHaveURL(url => url.search === '?float=0.1')
  await expect(page.locator('#float_value')).toHaveText('0.1')
  await page.locator('#float_decrement').click()
  await expect(page).toHaveURL(url => url.search === '?float=0')
  await expect(page.locator('#float_value')).toHaveText('0')
  await page.locator('#float_decrement').click()
  await expect(page).toHaveURL(url => url.search === '?float=-0.1')
  await expect(page.locator('#float_value')).toHaveText('-0.1')
  await page.locator('#float_clear').click()
  await expect(page).toHaveURL(url => url.search === '')
  await expect(page.locator('#float_value')).toBeEmpty()

  // Bool
  await expect(page.locator('#bool_value')).toBeEmpty()
  await page.locator('#bool_toggle').click()
  await expect(page).toHaveURL(url => url.search === '?bool=true')
  await expect(page.locator('#bool_value')).toHaveText('true')
  await page.locator('#bool_toggle').click()
  await expect(page).toHaveURL(url => url.search === '?bool=false')
  await expect(page.locator('#bool_value')).toHaveText('false')
  await page.locator('#bool_clear').click()
  await expect(page).toHaveURL(url => url.search === '')
  await expect(page.locator('#bool_value')).toBeEmpty()

  // Index
  await expect(page.locator('#index_value')).toBeEmpty()
  await page.locator('#index_increment').click()
  await expect(page).toHaveURL(url => url.search === '?index=2')
  await expect(page.locator('#index_value')).toHaveText('1')
  await page.locator('#index_increment').click()
  await expect(page).toHaveURL(url => url.search === '?index=3')
  await expect(page.locator('#index_value')).toHaveText('2')
  await page.locator('#index_decrement').click()
  await expect(page).toHaveURL(url => url.search === '?index=2')
  await expect(page.locator('#index_value')).toHaveText('1')
  await page.locator('#index_decrement').click()
  await expect(page).toHaveURL(url => url.search === '?index=1')
  await expect(page.locator('#index_value')).toHaveText('0')
  await page.locator('#index_decrement').click()
  await page.locator('#index_clear').click()
  await expect(page).toHaveURL(url => url.search === '')
  await expect(page.locator('#index_value')).toBeEmpty()

  // todo: Add tests for:
  // Timestamp
  // ISO DateTime
  // String enum
  // JSON object
  // Array of strings
  // Array of integers
}

test.describe('useQueryState (app router)', () => {
  test('works in standard routes', async ({ page, baseURL }) => {
    await navigateTo(page, '/app/useQueryState')
    const basePath = new URL(baseURL!).pathname.replace(/\/$/, '')
    await runTest(page, `${basePath}/app/useQueryState`)
  })

  test('works in dynamic routes', async ({ page, baseURL }) => {
    await navigateTo(page, '/app/useQueryState/dynamic/route')
    const basePath = new URL(baseURL!).pathname.replace(/\/$/, '')
    await runTest(page, `${basePath}/app/useQueryState/dynamic/route`)
  })
})

test.describe('useQueryState (pages router)', () => {
  test('works in standard routes', async ({ page, baseURL }) => {
    await navigateTo(page, '/pages/useQueryState')
    const basePath = new URL(baseURL!).pathname.replace(/\/$/, '')
    await runTest(page, `${basePath}/pages/useQueryState`)
  })

  test('works in dynamic routes', async ({ page, baseURL }) => {
    await navigateTo(page, '/pages/useQueryState/dynamic/route')
    const basePath = new URL(baseURL!).pathname.replace(/\/$/, '')
    await runTest(page, `${basePath}/pages/useQueryState/dynamic/route`)
  })
})
