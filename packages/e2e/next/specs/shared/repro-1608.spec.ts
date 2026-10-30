import { expect, test } from '@playwright/test'
import { navigateTo } from 'e2e-shared/playwright/navigate.ts'

for (const navigate of [false, true]) {
  test(
    navigate
      ? 'Pages Router navigation preserves the flushed count after an empty update'
      : 'empty Pages Router update reads the latest flushed query',
    async ({ page }) => {
      await navigateTo(page, '/pages/repro-1608/red', '?count=1')
      await expect(page.getByTestId('count')).toHaveText('1')
      await page
        .getByRole('button', {
          name: navigate ? 'Update and navigate' : 'Update and read snapshot'
        })
        .click()
      await expect(page.getByTestId('report')).not.toHaveText('null')

      const report = JSON.parse(
        (await page.getByTestId('report').textContent()) ?? 'null'
      ) as { first: string | null; second: string | null }
      expect(report.first).toBe('2')
      expect(report.second).toBe('2')

      if (navigate) {
        await expect(page).toHaveURL(
          url =>
            url.pathname.endsWith('/pages/repro-1608/blue') &&
            url.searchParams.get('count') === '2'
        )
      }
    }
  )
}
