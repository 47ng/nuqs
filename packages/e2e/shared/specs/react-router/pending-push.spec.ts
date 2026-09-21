import { expect, test as it, type Page } from '@playwright/test'
import { defineTest } from '../../define-test'
import { expectSearch } from '../../playwright/expect-url'
import { navigateTo } from '../../playwright/navigate'
import type { LoaderRequestData } from './pending-loader.defs'

async function expectRequests(page: Page, count: number) {
  await expect
    .poll(() =>
      page.evaluate(() => window.pendingLoaderControl?.requests.length ?? 0)
    )
    .toBe(count)
}

async function releaseLoader(page: Page, id: number) {
  await expectRequests(page, id)
  await releaseRequests(page, [id])
}

async function releaseRequests(page: Page, ids: number[]) {
  await page.evaluate(async ids => {
    for (const id of ids) {
      window.pendingLoaderControl!.requests[id - 1]!.release()
    }
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  }, ids)
}

async function blockedBack(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>(resolve => {
        let remaining = 2
        const onPop = () => {
          if (--remaining === 0) {
            window.removeEventListener('popstate', onPop)
            resolve()
          }
        }
        window.addEventListener('popstate', onPop)
        history.back()
      })
  )
  await expect(page.locator('#blocker')).toHaveText('blocked')
}

async function expectState(page: Page, data: LoaderRequestData) {
  await expectSearch(page, data)
  await expect(page.locator('#q-state')).toHaveText(data.q ?? '')
  await expect(page.locator('#page-state')).toHaveText(data.page ?? '')
  await expect(page.locator('#panel-state')).toHaveText(data.panel ?? '')
}

async function expectData(page: Page, data: LoaderRequestData) {
  await expect(page.locator('#loader-data')).toHaveText(JSON.stringify(data))
  await expect(page.locator('#navigation-state')).toHaveText('idle')
}

const initial = { q: 'init', page: '1', panel: null }
const qOnly = { q: 'tea', page: '1', panel: null }
const bothDeep = { q: 'tea', page: '2', panel: null }

export const testPendingPush = defineTest(
  'Pending navigation blockers',
  ({ path }) => {
    for (const qHistory of ['replace'] as const) {
      for (const decision of ['cancel', 'proceed'] as const) {
        it(`keeps repeated Back blocked through accepted completion (${qHistory}, ${decision})`, async ({
          page
        }) => {
          await navigateTo(
            page,
            path,
            `?q=init&page=1&qHistory=${qHistory}&panelHistory=push`
          )
          await expectData(page, initial)
          const length = await page.evaluate(() => {
            document.body.dataset.pendingPush = 'mounted'
            return history.length
          })
          const expectedLength = length + 1
          await page.locator('#set-q').click()
          await expectRequests(page, 1)
          await expectState(page, qOnly)
          await page.locator('#panel-open').click()
          const latest = { ...qOnly, panel: 'open' }
          await expectState(page, latest)
          await page.locator('#block-navigation').check()
          await blockedBack(page)
          await expectState(page, latest)
          await blockedBack(page)
          await expectState(page, latest)
          await expectRequests(page, 1)
          expect(
            await page.evaluate(() => ({
              aborted: window.pendingLoaderControl!.requests[0]!.aborted,
              completed: window.pendingLoaderControl!.completed
            }))
          ).toEqual({ aborted: false, completed: [] })
          await releaseLoader(page, 1)
          await expectData(page, qOnly)
          await expect(page.locator('#blocker')).toHaveText('blocked')
          await expectState(page, latest)
          await expectRequests(page, 1)
          expect(await page.evaluate(() => history.length)).toBe(expectedLength)
          await page.locator(`#${decision}`).click()
          if (decision === 'cancel') {
            await expect(page.locator('#blocker')).toHaveText('unblocked')
            await expectState(page, latest)
            await expectRequests(page, 1)
            await blockedBack(page)
            await page.locator('#proceed').click()
          }
          await releaseLoader(page, 2)
          await expectState(page, qOnly)
          await expectData(page, qOnly)
          await page.locator('#block-navigation').uncheck()
          await page.goForward()
          await releaseLoader(page, 3)
          await expectState(page, latest)
          await expectData(page, latest)
          expect(await page.evaluate(() => history.length)).toBe(expectedLength)
          expect(
            await page.evaluate(() => document.body.dataset.pendingPush)
          ).toBe('mounted')
        })
      }
    }

    for (const decision of ['cancel', 'proceed'] as const) {
      it(`restores blocked Back from a shallow push while its deep replace waits (${decision})`, async ({
        page
      }) => {
        const documents: string[] = []
        page.on('request', request => {
          if (
            request.isNavigationRequest() &&
            request.frame() === page.mainFrame()
          ) {
            documents.push(request.url())
          }
        })
        await navigateTo(
          page,
          path,
          '?q=init&page=1&qHistory=replace&panelHistory=push'
        )
        await expectData(page, initial)
        const length = await page.evaluate(() => {
          document.body.dataset.pendingPush = 'mounted'
          return history.length
        })
        const initialDocuments = documents.length
        await page.locator('#set-q').click()
        await expectRequests(page, 1)
        await expectState(page, qOnly)
        await page.locator('#panel-open').click()
        const withPanel = { ...qOnly, panel: 'open' }
        await expectState(page, withPanel)
        await expectRequests(page, 1)
        await page.locator('#block-navigation').check()
        await page.evaluate(() => history.back())
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectState(page, withPanel)
        expect(documents).toHaveLength(initialDocuments)
        await releaseLoader(page, 1)
        await expectData(page, qOnly)
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectState(page, withPanel)
        await expectRequests(page, 1)
        expect(await page.evaluate(() => history.length)).toBe(length + 1)
        await page.locator(`#${decision}`).click()
        if (decision === 'cancel') {
          await expect(page.locator('#blocker')).toHaveText('unblocked')
          await expectState(page, withPanel)
          await expectRequests(page, 1)
          await page.evaluate(() => history.back())
          await expect(page.locator('#blocker')).toHaveText('blocked')
          await page.locator('#proceed').click()
        }
        await releaseLoader(page, 2)
        await expectState(page, qOnly)
        await expectData(page, qOnly)
        await page.locator('#block-navigation').uncheck()
        await page.goForward()
        await releaseLoader(page, 3)
        await expectState(page, withPanel)
        await expectData(page, withPanel)
        await page.goBack()
        await releaseLoader(page, 4)
        await expectState(page, qOnly)
        await expectData(page, qOnly)
        expect(await page.evaluate(() => history.length)).toBe(length + 1)
        expect(documents).toHaveLength(initialDocuments)
        expect(
          await page.evaluate(() => document.body.dataset.pendingPush)
        ).toBe('mounted')
      })
    }

    for (const decision of ['cancel', 'proceed'] as const) {
      it(`keeps blocked Back open when its accepted push loader finishes after a shallow replace (${decision})`, async ({
        page
      }) => {
        await navigateTo(
          page,
          path,
          '?q=init&page=1&qHistory=push&panelHistory=replace'
        )
        await expectData(page, initial)
        const length = await page.evaluate(() => {
          document.body.dataset.pendingPush = 'mounted'
          return history.length
        })
        await page.locator('#set-q').click()
        await expectRequests(page, 1)
        await expectState(page, qOnly)
        await page.locator('#panel-open').click()
        const withPanel = { ...qOnly, panel: 'open' }
        await expectState(page, withPanel)
        await page.locator('#block-navigation').check()
        await page.evaluate(() => history.back())
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectState(page, withPanel)
        await releaseLoader(page, 1)
        await expectData(page, qOnly)
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectState(page, withPanel)
        await expectRequests(page, 1)
        expect(await page.evaluate(() => history.length)).toBe(length + 1)
        await page.locator(`#${decision}`).click()
        if (decision === 'cancel') {
          await expect(page.locator('#blocker')).toHaveText('unblocked')
          await expectState(page, withPanel)
          await expectRequests(page, 1)
          await page.evaluate(() => history.back())
          await expect(page.locator('#blocker')).toHaveText('blocked')
          await page.locator('#proceed').click()
        }
        await expectState(page, initial)
        await expectData(page, initial)
        await expectRequests(page, 1)
        await page.locator('#block-navigation').uncheck()
        await page.goForward()
        await releaseLoader(page, 2)
        await expectState(page, withPanel)
        await expectData(page, withPanel)
        expect(await page.evaluate(() => history.length)).toBe(length + 1)
        expect(
          await page.evaluate(() => document.body.dataset.pendingPush)
        ).toBe('mounted')
      })
    }

    for (const decision of ['cancel', 'proceed'] as const) {
      it(`keeps replace continuity when its pending loader precedes a blocked push (${decision})`, async ({
        page
      }) => {
        await navigateTo(
          page,
          path,
          '?q=init&page=1&qHistory=replace&pageHistory=push'
        )
        await expectData(page, initial)
        const length = await page.evaluate(() => {
          document.body.dataset.pendingPush = 'mounted'
          return history.length
        })
        await page.locator('#set-q').click()
        await expectRequests(page, 1)
        await expectState(page, qOnly)
        await page.locator('#block-navigation').check()
        await page.locator('#set-page').click()
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectState(page, bothDeep)
        if (decision === 'cancel') {
          await page.locator('#cancel').click()
          await expect(page.locator('#blocker')).toHaveText('unblocked')
        }
        await releaseLoader(page, 1)
        await expectData(page, qOnly)
        await expectState(page, bothDeep)
        if (decision === 'proceed') {
          await expect(page.locator('#blocker')).toHaveText('blocked')
          await page.locator('#proceed').click()
          await releaseLoader(page, 2)
          await expectData(page, bothDeep)
        }
        expect(await page.evaluate(() => history.length)).toBe(length + 1)
        await page.evaluate(() => history.back())
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectState(page, bothDeep)
        await page.locator('#cancel').click()
        await expect(page.locator('#blocker')).toHaveText('unblocked')
        await expectState(page, bothDeep)
        await page.evaluate(() => history.back())
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await page.locator('#proceed').click()
        await releaseLoader(page, decision === 'proceed' ? 3 : 2)
        await expectState(page, qOnly)
        await expectData(page, qOnly)
        expect(
          await page.evaluate(() => document.body.dataset.pendingPush)
        ).toBe('mounted')
      })
    }

    it('finishes the accepted push without an extra entry after shallow replace and cancelled Back', async ({
      page
    }) => {
      await navigateTo(
        page,
        path,
        '?q=init&page=1&qHistory=push&panelHistory=replace'
      )
      await expectData(page, initial)
      const length = await page.evaluate(() => history.length)
      await page.locator('#set-q').click()
      await expectRequests(page, 1)
      await expectState(page, qOnly)
      await page.locator('#panel-open').click()
      const withPanel = { ...qOnly, panel: 'open' }
      await expectState(page, withPanel)
      await page.locator('#block-navigation').check()
      await page.evaluate(() => history.back())
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectState(page, withPanel)
      await page.locator('#cancel').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectState(page, withPanel)
      await releaseLoader(page, 1)
      await expectData(page, qOnly)
      await expectState(page, withPanel)
      expect(await page.evaluate(() => history.length)).toBe(length + 1)
      await page.evaluate(() => history.back())
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectState(page, withPanel)
      await page.locator('#proceed').click()
      await expectState(page, initial)
      await expectData(page, initial)
      await expectRequests(page, 1)
      await page.locator('#block-navigation').uncheck()
      await page.goForward()
      await releaseLoader(page, 2)
      await expectState(page, withPanel)
      await expectData(page, withPanel)
    })

    it('discards the accepted loader when the coalesced blocked second deep push proceeds first', async ({
      page
    }) => {
      await navigateTo(
        page,
        path,
        '?q=init&page=1&qHistory=push&pageHistory=push'
      )
      await expectData(page, initial)
      const length = await page.evaluate(() => history.length)
      await page.locator('#set-q').click()
      await expectRequests(page, 1)
      await expectState(page, qOnly)
      await page.locator('#block-navigation').check()
      await page.locator('#set-page').click()
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectState(page, bothDeep)
      await page.locator('#proceed').click()
      await expectRequests(page, 2)
      expect(
        await page.evaluate(
          () => window.pendingLoaderControl!.requests[0]!.aborted
        )
      ).toBe(true)
      await releaseLoader(page, 2)
      await expectData(page, bothDeep)
      await releaseRequests(page, [1])
      await expectData(page, bothDeep)
      await expectState(page, bothDeep)
      expect(await page.evaluate(() => history.length)).toBe(length + 1)
      await page.locator('#block-navigation').uncheck()
      await page.goBack()
      await expectState(page, initial)
      await expectData(page, initial)
      await expectRequests(page, 2)
      await page.goForward()
      await releaseLoader(page, 3)
      await expectState(page, bothDeep)
      await expectData(page, bothDeep)
    })

    for (const decision of ['cancel', 'proceed'] as const) {
      it(`keeps a coalesced blocked second deep push open while the accepted loader finishes (${decision})`, async ({
        page
      }) => {
        await navigateTo(
          page,
          path,
          '?q=init&page=1&qHistory=push&pageHistory=push'
        )
        await expectData(page, initial)
        const length = await page.evaluate(() => history.length)
        await page.locator('#set-q').click()
        await expectRequests(page, 1)
        await expectState(page, qOnly)
        await page.locator('#block-navigation').check()
        await page.locator('#set-page').click()
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectState(page, bothDeep)
        await releaseLoader(page, 1)
        await expectData(page, qOnly)
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectState(page, bothDeep)
        await expectRequests(page, 1)
        expect(await page.evaluate(() => history.length)).toBe(length + 1)
        await page.locator(`#${decision}`).click()
        if (decision === 'proceed') {
          await releaseLoader(page, 2)
          await expectData(page, bothDeep)
        }
        await expect(page.locator('#blocker')).toHaveText('unblocked')
        await expectState(page, bothDeep)
        await page.locator('#block-navigation').uncheck()
        await page.goBack()
        await expectState(page, initial)
        await expectData(page, initial)
        await expectRequests(page, decision === 'proceed' ? 2 : 1)
        await page.goForward()
        await releaseLoader(page, decision === 'proceed' ? 3 : 2)
        await expectState(page, bothDeep)
        await expectData(page, bothDeep)
        expect(await page.evaluate(() => history.length)).toBe(length + 1)
      })
    }

    for (const cancelBack of [false, true]) {
      it(`keeps one coalesced entry when a blocked second deep push is cancelled before the accepted loader finishes (cancel Back: ${cancelBack})`, async ({
        page
      }) => {
        await navigateTo(
          page,
          path,
          '?q=init&page=1&qHistory=push&pageHistory=push'
        )
        await expectData(page, initial)
        const length = await page.evaluate(() => history.length)
        await page.locator('#set-q').click()
        await expectRequests(page, 1)
        await expectState(page, qOnly)
        await page.locator('#block-navigation').check()
        await page.locator('#set-page').click()
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectState(page, bothDeep)
        await expectRequests(page, 1)
        await page.locator('#cancel').click()
        await expect(page.locator('#blocker')).toHaveText('unblocked')
        if (cancelBack) {
          await page.evaluate(() => history.back())
          await expect(page.locator('#blocker')).toHaveText('blocked')
          await expectState(page, bothDeep)
          await page.locator('#cancel').click()
          await expect(page.locator('#blocker')).toHaveText('unblocked')
          await expectState(page, bothDeep)
        }
        await releaseLoader(page, 1)
        await expectData(page, qOnly)
        await expectState(page, bothDeep)
        expect(await page.evaluate(() => history.length)).toBe(length + 1)
        await page.locator('#block-navigation').uncheck()
        await page.goBack()
        await expectState(page, initial)
        await expectData(page, initial)
        await expectRequests(page, 1)
        await page.goForward()
        await releaseLoader(page, 2)
        await expectState(page, bothDeep)
        await expectData(page, bothDeep)
        expect(await page.evaluate(() => history.length)).toBe(length + 1)
      })
    }
  }
)
