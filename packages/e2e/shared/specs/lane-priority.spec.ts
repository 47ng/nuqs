import { expect, test as it } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

export const testLanePriority = defineTest('Lane priority', ({ path }) => {
  it('keeps pending query state on its transition lane', async ({ page }) => {
    await navigateTo(page, path)

    const value = page.getByLabel('Value', { exact: true })
    const renderedValues = page.getByLabel('Rendered values', { exact: true })

    await expect(value).toHaveText('null')
    await expect(renderedValues).toHaveText('null')

    // Keep both discrete events in one browser task. Awaiting separate clicks
    // would let the transition commit before the urgent update can interrupt it.
    await page.evaluate(`
      document.querySelector('[data-testid="write"]').dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      )
      document.querySelector('[data-testid="tick"]').dispatchEvent(
        new MouseEvent('click', { bubbles: true })
      )
    `)

    await expect(page).toHaveURL(/\?value=B$/)
    await expect(value).toHaveText('B')
    await expect(renderedValues).toContainText('B')
    const renders = (await renderedValues.textContent())?.split(',')
    expect(renders?.[1]).toBe('null')
    expect(renders?.at(-1)).toBe('B')
  })
})
