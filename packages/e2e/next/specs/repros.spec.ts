import { expect, test, type Page } from '@playwright/test'
import { expectSearch, expectUrl } from 'e2e-shared/playwright/expect-url.ts'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

test('Reproduction for issue #388', async ({ page }) => {
  await navigateTo(page, '/app/repro-388')

  await page.locator('#start').click()
  // The URL should have a ?counter=1 query string
  await expect(page).toHaveURL(url => url.search === '?counter=1')
  // The counter should be rendered as 1 on the page
  await expect(page.locator('#counter')).toHaveText('Counter: 1')
  // Hover the "Hover me" link
  await page.locator('#hover-me').hover()
  await page.waitForTimeout(100)
  // The URL should have a ?counter=1 query string
  await expect(page).toHaveURL(url => url.search === '?counter=1')
  // The counter should be rendered as 1 on the page
  await expect(page.locator('#counter')).toHaveText('Counter: 1')

  // Reset the page
  await navigateTo(page, '/app/repro-388')
  await page.locator('#start').click()
  // The URL should have a ?counter=1 query string
  await expect(page).toHaveURL(url => url.search === '?counter=1')
  // The counter should be rendered as 1 on the page
  await expect(page.locator('#counter')).toHaveText('Counter: 1')
  // Mount the other link
  await page.locator('#toggle').click()
  await page.waitForTimeout(100)
  // The URL should have a ?counter=1 query string
  await expect(page).toHaveURL(url => url.search === '?counter=1')
  // The counter should be rendered as 1 on the page
  await expect(page.locator('#counter')).toHaveText('Counter: 1')
})

test('Reproduction for issue #498', async ({ page }) => {
  await navigateTo(page, '/app/repro-498')
  await page.locator('#start').click()
  await expect(page).toHaveURL(url => url.hash === '#section')
  await page.locator('button').click()
  await expect(page).toHaveURL(url => url.search === '?q=test')
  await expect(page).toHaveURL(url => url.hash === '#section')
})

test('Reproduction for issue #542', async ({ page }) => {
  await navigateTo(page, '/app/repro-542/a', '?q=foo&r=bar')
  await expect(page.locator('#q')).toHaveText('foo')
  await expect(page.locator('#r')).toHaveText('bar')
  await expect(page.locator('#initial')).toHaveText('{"q":"foo","r":"bar"}')
  await page.locator('a').click()
  await expect(page).toHaveURL(url => url.search === '')
  await expect(page.locator('#q')).toHaveText('')
  await expect(page.locator('#r')).toHaveText('')
  await expect(page.locator('#initial')).toHaveText('{"q":null,"r":null}')
})

test.describe('Reproduction for issue #630', () => {
  test('works with useQueryState', async ({ page }) => {
    await runTest(page, '1')
  })
  test('works with useQueryStates', async ({ page }) => {
    await runTest(page, '3')
  })

  async function runTest(page: Page, sectionToTry: string) {
    await navigateTo(page, '/app/repro-630')
    await expect(page.getByTestId('1-pre')).toHaveText('{"a":null,"b":null}')
    await expect(page.getByTestId('2-pre')).toHaveText('{"a":null,"b":null}')
    await expect(page.getByTestId('3-pre')).toHaveText('{"a":null,"b":null}')
    await expect(page.getByTestId('4-pre')).toHaveText('{"a":null,"b":null}')

    await page.getByTestId(`${sectionToTry}-set`).click()
    await expect(page.getByTestId('1-pre')).toHaveText('{"a":"1","b":"2"}')
    await expect(page.getByTestId('2-pre')).toHaveText('{"a":"1","b":"2"}')
    await expect(page.getByTestId('3-pre')).toHaveText('{"a":"1","b":"2"}')
    await expect(page.getByTestId('4-pre')).toHaveText('{"a":"1","b":"2"}')
    await expectSearch(page, { a: '1', b: '2' })

    await page.getByTestId(`${sectionToTry}-clear`).click()
    await expect(page.getByTestId('1-pre')).toHaveText('{"a":null,"b":null}')
    await expect(page.getByTestId('2-pre')).toHaveText('{"a":null,"b":null}')
    await expect(page.getByTestId('3-pre')).toHaveText('{"a":null,"b":null}')
    await expect(page.getByTestId('4-pre')).toHaveText('{"a":null,"b":null}')
    await expectUrl(page, url => url.search === '')

    await page.goBack()
    await expect(page.getByTestId('1-pre')).toHaveText('{"a":"1","b":"2"}')
    await expect(page.getByTestId('2-pre')).toHaveText('{"a":"1","b":"2"}')
    await expect(page.getByTestId('3-pre')).toHaveText('{"a":"1","b":"2"}')
    await expect(page.getByTestId('4-pre')).toHaveText('{"a":"1","b":"2"}')
    await expectSearch(page, { a: '1', b: '2' })

    await page.goBack()
    await expect(page.getByTestId('1-pre')).toHaveText('{"a":null,"b":null}')
    await expect(page.getByTestId('2-pre')).toHaveText('{"a":null,"b":null}')
    await expect(page.getByTestId('3-pre')).toHaveText('{"a":null,"b":null}')
    await expect(page.getByTestId('4-pre')).toHaveText('{"a":null,"b":null}')
    await expectUrl(page, url => url.search === '')
  }
})

test.describe('repro-758', () => {
  test('honors urlKeys when navigating back after a push', async ({ page }) => {
    await navigateTo(page, '/app/repro-758')
    await page.locator('button').click()
    await expect(page.locator('#state')).toHaveText('test')
    await page.goBack()
    await expect(page.locator('#state')).toBeEmpty()
  })
})

test.describe('repro-760', () => {
  test('supports dynamic default values', async ({ page }) => {
    await navigateTo(page, '/app/repro-760')
    await expect(page.locator('#value-a')).toHaveText('a')
    await expect(page.locator('#value-b')).toHaveText('b')
    await page.locator('#trigger-a').click()
    await page.locator('#trigger-b').click()
    await expect(page.locator('#value-a')).toHaveText('pass')
    await expect(page.locator('#value-b')).toHaveText('pass')
  })
})

test.describe('repro-774', () => {
  test('updates internal state on navigation', async ({ page }) => {
    await navigateTo(page, '/app/repro-774')
    await page.locator('#trigger-a').click()
    await expect(page.locator('#value-a')).toHaveText('a')
    await expect(page.locator('#value-b')).toBeEmpty()
    await page.locator('#link').click()
    await expect(page.locator('#value-a')).toBeEmpty()
    await expect(page.locator('#value-b')).toBeEmpty()
    await page.locator('#trigger-b').click()
    await expect(page.locator('#value-a')).toBeEmpty()
    await expect(page.locator('#value-b')).toHaveText('b')
  })
})
