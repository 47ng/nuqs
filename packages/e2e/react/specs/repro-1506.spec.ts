import { expect, test } from '@playwright/test'

test('reproduces a committed value reverting during a colocated transition', async ({
  page
}) => {
  await page.goto('/repro-1506')

  const count = page.getByLabel('Count')
  const committedValues = page.getByLabel('Committed values')

  await expect(count).toHaveText('0')
  await expect(committedValues).toHaveText('0')

  await page.getByRole('button', { name: 'Increment' }).click()

  await expect(page).toHaveURL(/\?count=1$/)
  await expect(count).toHaveText('1')
  await expect(committedValues).toHaveText('0,1,0,1')
})
