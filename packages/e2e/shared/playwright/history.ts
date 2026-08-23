import type { Page } from '@playwright/test'

export function readHistoryIndex(page: Page): Promise<number> {
  return page.evaluate(() => (window.history.state as { idx: number }).idx)
}
