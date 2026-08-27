import { type Frame, type Page, expect } from '@playwright/test'

type ExpectedSearch = Record<string, string | string[]>

export type UrlSpy = {
  reset(): void
  assertSearches(expected: ExpectedSearch[]): Promise<void>
  [Symbol.dispose]: () => void
}

export function setupUrlSpy(page: Page): UrlSpy {
  const urls: string[] = []
  const handler = (frame: Frame) => {
    if (frame === page.mainFrame()) {
      // ignore if the url is identical to the last record
      if (urls.length > 0 && urls[urls.length - 1] === frame.url()) {
        return
      }
      console.log('Navigated to', frame.url())
      urls.push(frame.url())
    }
  }
  page.on('framenavigated', handler)

  async function assertSearches(expected: ExpectedSearch[]) {
    return expect
      .poll(
        () =>
          urls.map((url, index) => {
            const searchParams = new URL(url).searchParams
            return Object.fromEntries(
              Object.entries(expected[index] ?? {}).map(([key, value]) => [
                key,
                Array.isArray(value)
                  ? searchParams.getAll(key)
                  : searchParams.get(key)
              ])
            )
          }),
        {
          intervals: Array.from({ length: 40 }, _ => 50),
          timeout: 2000,
          message: 'Expected recorded URL navigations to match'
        }
      )
      .toEqual(expected)
  }

  return {
    reset() {
      urls.length = 0
    },
    assertSearches,
    [Symbol.dispose]() {
      page.off('framenavigated', handler)
    }
  }
}
