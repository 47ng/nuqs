import { type Page, expect } from '@playwright/test'

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

export function expectSearch(page: Page, expected: Record<string, string>) {
  return expectUrl(
    page,
    url =>
      Object.entries(expected).every(
        ([key, value]) => url.searchParams.get(key) === value
      ),
    { message: `URL search params to match ${JSON.stringify(expected)}` }
  )
}
