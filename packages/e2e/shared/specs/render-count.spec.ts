import { expect, test as it } from '@playwright/test'
import { defineTest, type TestConfig } from '../define-test'
import { assertLogCount, setupLogSpy } from '../playwright/log-spy'
import { navigateTo } from '../playwright/navigate'

type TestRenderCountConfig = TestConfig & {
  props: {
    shallow: boolean
    history: 'push' | 'replace'
    startTransition: boolean
    delay?: number
  }
  expected: {
    mount: number
    update: number
  }
}

export function testRenderCount({
  props,
  expected,
  ...config
}: TestRenderCountConfig) {
  const test = defineTest(
    {
      label: 'Render count',
      variants:
        `shallow: ${props.shallow}, history: ${props.history}, startTransition: ${props.startTransition}` +
        (props.delay ? `, delay: ${props.delay}ms` : '')
    },
    ({ path }) => {
      it(`should render ${times(expected.mount)} on mount`, async ({
        page
      }) => {
        using logSpy = setupLogSpy(page)
        await navigateTo(page, path)
        await assertLogCount(logSpy, 'render', expected.mount)
      })

      it(`should then render ${times(expected.update)} on updates`, async ({
        page
      }) => {
        using logSpy = setupLogSpy(page)
        await navigateTo(page, path)
        await page.locator('button').click()
        if (props.delay) {
          await page.waitForTimeout(props.delay)
        }
        await expect(page.locator('#state')).toHaveText('pass')
        await expect(page).toHaveURL(url => url.search.includes('test=pass'))
        await assertLogCount(logSpy, 'render', expected.mount + expected.update)
      })
    }
  )
  return test(config)
}

function times(n: number) {
  if (n === 1) {
    return 'once'
  }
  return `${n} times`
}
