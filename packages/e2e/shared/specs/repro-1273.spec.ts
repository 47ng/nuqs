import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { expectUrl } from '../playwright/expect-url'
import { navigateTo } from '../playwright/navigate'

export const testRepro1273 = defineTest('repro-1273', ({ path }) => {
  it('has the correct state when we navigate to a page we visited before with different search params (router)', async ({
    page
  }) => {
    await navigateTo(page, path)

    // Navigate to <path>/other?test=1
    await page.getByRole('button', { name: 'Router 1' }).click()
    await expectUrl(
      page,
      url =>
        url.pathname.endsWith(`${path}/other`) &&
        url.searchParams.get('test') === '1'
    )
    await expect(page.getByRole('code')).toHaveText('test: 1')

    // Navigate back
    await page.goBack()
    await expectUrl(
      page,
      url =>
        url.pathname.endsWith(path) && url.searchParams.get('test') === null
    )

    // Navigate to <path>/other?test=2
    await page.getByRole('button', { name: 'Router 2' }).click()
    await expectUrl(
      page,
      url =>
        url.pathname.endsWith(`${path}/other`) &&
        url.searchParams.get('test') === '2'
    )
    await expect(page.getByRole('code')).toHaveText('test: 2')
  })

  it('has the correct state when we navigate to a page we visited before with different search params (Link)', async ({
    page
  }) => {
    await navigateTo(page, path)

    // Navigate to <path>/other?test=1
    await page.getByRole('link', { name: 'Link 1' }).click()
    await expectUrl(
      page,
      url =>
        url.pathname.endsWith(`${path}/other`) &&
        url.searchParams.get('test') === '1'
    )
    await expect(page.getByRole('code')).toHaveText('test: 1')

    // Navigate back
    await page.goBack()
    await expectUrl(
      page,
      url =>
        url.pathname.endsWith(path) && url.searchParams.get('test') === null
    )

    // Navigate to <path>/other?test=2
    await page.getByRole('link', { name: 'Link 2' }).click()
    await expectUrl(
      page,
      url =>
        url.pathname.endsWith(`${path}/other`) &&
        url.searchParams.get('test') === '2'
    )
    await expect(page.getByRole('code')).toHaveText('test: 2')
  })
})
