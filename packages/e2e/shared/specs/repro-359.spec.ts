import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { createSearchMatcher } from '../playwright/expect-url'
import { navigateTo } from '../playwright/navigate'

export const testRepro359 = defineTest('repro-359', ({ path, isHashRouter }) => {
  it('should follow cross-link updates & conditional mounting', async ({
    page
  }) => {
    await navigateTo(page, path, '', { isHashRouter })

    await expect(page).toHaveURL(
      createSearchMatcher('', isHashRouter ?? false)
    )
    await expect(page.locator('#nuqs-param')).toHaveText('null')
    await expect(page.locator('#nuqs-component')).toHaveText('')
    await expect(page.locator('#nuqss-param')).toHaveText('null')
    await expect(page.locator('#nuqss-component')).toHaveText('')

    await page.getByText('Component 1 (nuqs)').click()
    await expect(page).toHaveURL(
      createSearchMatcher('?param=comp1&component=comp1', isHashRouter ?? false)
    )
    await expect(page.locator('#comp1')).toHaveText('comp1')
    await expect(page.locator('#comp2')).not.toBeAttached()
    await expect(page.locator('#nuqs-param')).toHaveText('comp1')
    await expect(page.locator('#nuqs-component')).toHaveText('comp1')
    await expect(page.locator('#nuqss-param')).toHaveText('comp1')
    await expect(page.locator('#nuqss-component')).toHaveText('comp1')

    await page.getByText('Component 2 (nuqs)').click()
    await expect(page).toHaveURL(
      createSearchMatcher('?param=comp2&component=comp2', isHashRouter ?? false)
    )
    await expect(page.locator('#comp1')).not.toBeAttached()
    await expect(page.locator('#comp2')).toHaveText('comp2')
    await expect(page.locator('#nuqs-param')).toHaveText('comp2')
    await expect(page.locator('#nuqs-component')).toHaveText('comp2')
    await expect(page.locator('#nuqss-param')).toHaveText('comp2')
    await expect(page.locator('#nuqss-component')).toHaveText('comp2')

    await page.getByText('Component 1 (nuq+)').click()
    await expect(page).toHaveURL(
      createSearchMatcher('?param=comp1&component=comp1', isHashRouter ?? false)
    )
    await expect(page.locator('#comp1')).toHaveText('comp1')
    await expect(page.locator('#comp2')).not.toBeAttached()
    await expect(page.locator('#nuqs-param')).toHaveText('comp1')
    await expect(page.locator('#nuqs-component')).toHaveText('comp1')
    await expect(page.locator('#nuqss-param')).toHaveText('comp1')
    await expect(page.locator('#nuqss-component')).toHaveText('comp1')

    await page.getByText('Component 2 (nuq+)').click()
    await expect(page).toHaveURL(
      createSearchMatcher('?param=comp2&component=comp2', isHashRouter ?? false)
    )
    await expect(page.locator('#comp1')).not.toBeAttached()
    await expect(page.locator('#comp2')).toHaveText('comp2')
    await expect(page.locator('#nuqs-param')).toHaveText('comp2')
    await expect(page.locator('#nuqs-component')).toHaveText('comp2')
    await expect(page.locator('#nuqss-param')).toHaveText('comp2')
    await expect(page.locator('#nuqss-component')).toHaveText('comp2')
  })
})
