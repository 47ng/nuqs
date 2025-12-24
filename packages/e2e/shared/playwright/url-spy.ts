import { type Frame, type Page, expect } from '@playwright/test'

type ExpectUrlOptions = {
  message?: string
  timeout?: number
  intervals?: number[]
}

export function expectUrl(
  page: Page,
  predicate: (url: URL) => boolean,
  options: ExpectUrlOptions = {}
) {
  return expect
    .poll(() => predicate(new URL(page.url())), {
      intervals:
        options.intervals ??
        Array.from({ length: (options.timeout ?? 5000) / 50 }, _ => 50),
      timeout: options.timeout ?? 5000,
      message: options.message
    })
    .toBe(true)
}

export type UrlSpy = {
  reset(): void
  assertSearches(expected: Array<Record<string, string>>): Promise<void>
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

  async function assertSearches(expected: Array<Record<string, string>>) {
    return expect
      .poll(
        () => {
          if (urls.length !== expected.length) {
            console.debug(
              `Expected ${expected.length} navigations, but got ${urls.length}:\n  ${urls.join('\n  ')}`
            )
            return false
          }
          return expected.every((expectedSearch, index) => {
            const url = new URL(urls[index])
            return Object.entries(expectedSearch).every(([key, value]) => {
              const expected = value
              const received = url.searchParams.get(key)
              if (url.searchParams.get(key) !== value) {
                console.debug(
                  `Expected navigation ${index} (${url}) to have search param ${key}=${expected}, but got ${received} instead`
                )
                return false
              }
              return true
            })
          })
        },
        { intervals: Array.from({ length: 40 }, _ => 50), timeout: 2000 }
      )
      .toBe(true)
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
