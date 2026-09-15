import { expect, test as it, type Page } from '@playwright/test'
import { defineTest } from '../../define-test'
import { expectSearch } from '../../playwright/expect-url'
import { readHistoryIndex } from '../../playwright/history'
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
  'Separate pending pushes',
  ({ path }) => {
    it('uses the latest repeated Back target after another shallow push', async ({
      page
    }) => {
      await navigateTo(
        page,
        path,
        '?q=init&page=1&qHistory=push&panelHistory=push'
      )
      await expectData(page, initial)
      const length = await page.evaluate(() => history.length)
      await page.locator('#set-q').click()
      await expectRequests(page, 1)
      await expectState(page, qOnly)
      await page.locator('#panel-before').click()
      const previous = { ...qOnly, panel: 'before' }
      await expectState(page, previous)
      await page.locator('#block-navigation').check()
      await blockedBack(page)
      await expectState(page, previous)
      await page.locator('#panel-open').click()
      const latest = { ...qOnly, panel: 'open' }
      await expectState(page, latest)
      await blockedBack(page)
      await expectState(page, latest)
      await releaseLoader(page, 1)
      await expectData(page, qOnly)
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectState(page, latest)
      await expectRequests(page, 1)
      await page.locator('#proceed').click()
      await releaseLoader(page, 2)
      await expectState(page, previous)
      await expectData(page, previous)
      await page.locator('#block-navigation').uncheck()
      await page.goForward()
      await releaseLoader(page, 3)
      await expectState(page, latest)
      await expectData(page, latest)
      expect(await page.evaluate(() => history.length)).toBe(length + 3)
    })

    for (const qHistory of ['push', 'replace'] as const) {
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
          const expectedLength = length + (qHistory === 'push' ? 2 : 1)
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

    it('keeps the blocked Back target when another shallow push precedes the accepted commit', async ({
      page
    }) => {
      await navigateTo(
        page,
        path,
        '?q=init&page=1&qHistory=push&panelHistory=push'
      )
      await expectData(page, initial)
      const length = await page.evaluate(() => history.length)
      await page.locator('#set-q').click()
      await expectRequests(page, 1)
      await expectState(page, qOnly)
      await page.locator('#panel-before').click()
      await expectState(page, { ...qOnly, panel: 'before' })
      await page.locator('#block-navigation').check()
      await page.evaluate(() => history.back())
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectState(page, { ...qOnly, panel: 'before' })
      await page.locator('#panel-open').click()
      const latest = { ...qOnly, panel: 'open' }
      await expectState(page, latest)
      await releaseLoader(page, 1)
      await expectData(page, qOnly)
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectState(page, latest)
      await expectRequests(page, 1)
      await page.locator('#proceed').click()
      await releaseLoader(page, 2)
      await expectState(page, qOnly)
      await expectData(page, qOnly)
      await page.locator('#block-navigation').uncheck()
      await page.goForward()
      await releaseLoader(page, 3)
      await expectState(page, { ...qOnly, panel: 'before' })
      await expectData(page, { ...qOnly, panel: 'before' })
      await page.goForward()
      await releaseLoader(page, 4)
      await expectState(page, latest)
      await expectData(page, latest)
      expect(await page.evaluate(() => history.length)).toBe(length + 3)
    })

    for (const decision of ['cancel', 'proceed'] as const) {
      it(`keeps blocked Forward open when the accepted Back loader finishes (${decision})`, async ({
        page
      }) => {
        await navigateTo(
          page,
          path,
          '?q=init&page=1&qHistory=push&panelHistory=push'
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
        await page.goBack()
        await expectRequests(page, 2)
        await expectState(page, qOnly)
        await page.locator('#block-navigation').check()
        await page.evaluate(() => history.forward())
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectState(page, qOnly)
        await releaseLoader(page, 2)
        await expectData(page, qOnly)
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectState(page, qOnly)
        await expectRequests(page, 2)
        await page.locator(`#${decision}`).click()
        if (decision === 'cancel') {
          await expect(page.locator('#blocker')).toHaveText('unblocked')
          await expectState(page, qOnly)
          await expectRequests(page, 2)
          await page.evaluate(() => history.forward())
          await expect(page.locator('#blocker')).toHaveText('blocked')
          await page.locator('#proceed').click()
        }
        await releaseLoader(page, 3)
        await expectState(page, withPanel)
        await expectData(page, withPanel)
        await releaseRequests(page, [1])
        await expectState(page, withPanel)
        await expectData(page, withPanel)
        expect(await page.evaluate(() => history.length)).toBe(length + 2)
        expect(
          await page.evaluate(() => document.body.dataset.pendingPush)
        ).toBe('mounted')
      })
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
      it(`keeps blocked Back open when its accepted push loader finishes (${decision})`, async ({
        page
      }) => {
        await navigateTo(
          page,
          path,
          '?q=init&page=1&qHistory=push&panelHistory=push'
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
        expect(await page.evaluate(() => history.length)).toBe(length + 2)
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
        expect(await page.evaluate(() => history.length)).toBe(length + 2)
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

    it('finishes the accepted push without an extra entry after blocked Back is cancelled', async ({
      page
    }) => {
      await navigateTo(
        page,
        path,
        '?q=init&page=1&qHistory=push&panelHistory=push'
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
      expect(await page.evaluate(() => history.length)).toBe(length + 2)
      await page.evaluate(() => history.back())
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectState(page, withPanel)
      await page.locator('#proceed').click()
      await releaseLoader(page, 2)
      await expectState(page, qOnly)
      await expectData(page, qOnly)
      await page.locator('#block-navigation').uncheck()
      await page.goBack()
      await expectState(page, initial)
      await expectData(page, initial)
    })

    it('restores blocked Forward while the allowed Back loader waits', async ({
      page
    }) => {
      await navigateTo(
        page,
        path,
        '?q=init&page=1&qHistory=push&panelHistory=push'
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
      await page.goBack()
      await expectRequests(page, 2)
      await expectState(page, qOnly)
      await page.locator('#block-navigation').check()
      await page.evaluate(() => history.forward())
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectState(page, qOnly)
      await page.locator('#cancel').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectState(page, qOnly)
      await expectRequests(page, 2)
      await page.evaluate(() => history.forward())
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectState(page, qOnly)
      await page.locator('#proceed').click()
      await releaseLoader(page, 3)
      await expectState(page, withPanel)
      await expectData(page, withPanel)
      await releaseRequests(page, [1, 2])
      await expectState(page, withPanel)
      await expectData(page, withPanel)
      expect(await page.evaluate(() => history.length)).toBe(length + 2)
      expect(await page.evaluate(() => document.body.dataset.pendingPush)).toBe(
        'mounted'
      )
      await page.locator('#block-navigation').uncheck()
      await page.goBack()
      await releaseLoader(page, 4)
      await expectState(page, qOnly)
      await expectData(page, qOnly)
      await page.goBack()
      await expectState(page, initial)
      await expectData(page, initial)
    })

    it('discards the accepted loader when the blocked second deep push proceeds first', async ({
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
      expect(await page.evaluate(() => history.length)).toBe(length + 2)
      await page.locator('#block-navigation').uncheck()
      await page.goBack()
      await releaseLoader(page, 3)
      await expectState(page, qOnly)
      await expectData(page, qOnly)
      await page.goBack()
      await expectState(page, initial)
      await expectData(page, initial)
    })

    it('restores blocked Back before the deep and shallow push loaders finish', async ({
      page
    }) => {
      await navigateTo(
        page,
        path,
        '?q=init&page=1&qHistory=push&panelHistory=push'
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
      await expectRequests(page, 1)
      await page.locator('#block-navigation').check()
      await page.evaluate(() => history.back())
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectState(page, withPanel)
      await page.locator('#cancel').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectState(page, withPanel)
      await expectRequests(page, 1)
      await page.evaluate(() => history.back())
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectState(page, withPanel)
      await page.locator('#proceed').click()
      await expectState(page, qOnly)
      await releaseLoader(page, 2)
      await expectData(page, qOnly)
      await releaseRequests(page, [1])
      await expectData(page, qOnly)
      await expectState(page, qOnly)
      await page.locator('#block-navigation').uncheck()
      await page.goForward()
      await releaseLoader(page, 3)
      await expectData(page, withPanel)
      await expectState(page, withPanel)
      expect(await page.evaluate(() => history.length)).toBe(length + 2)
      expect(await page.evaluate(() => document.body.dataset.pendingPush)).toBe(
        'mounted'
      )
      await page.locator('#block-navigation').uncheck()
      await page.goBack()
      await releaseLoader(page, 4)
      await expectState(page, qOnly)
      await expectData(page, qOnly)
      await page.goBack()
      await expectState(page, initial)
      await expectData(page, initial)
    })

    for (const decision of ['cancel', 'proceed'] as const) {
      it(`keeps a blocked second deep push open while the accepted loader finishes (${decision})`, async ({
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
        expect(await page.evaluate(() => history.length)).toBe(length + 2)
        await page.locator(`#${decision}`).click()
        if (decision === 'proceed') {
          await releaseLoader(page, 2)
          await expectData(page, bothDeep)
        }
        await expect(page.locator('#blocker')).toHaveText('unblocked')
        await expectState(page, bothDeep)
        await page.locator('#block-navigation').uncheck()
        await page.goBack()
        await expectState(page, qOnly)
        await releaseLoader(page, decision === 'proceed' ? 3 : 2)
        await expectData(page, qOnly)
        await page.goBack()
        await expectState(page, initial)
        await expectData(page, initial)
        await page.goForward()
        await releaseLoader(page, decision === 'proceed' ? 4 : 3)
        await expectData(page, qOnly)
        await page.goForward()
        await releaseLoader(page, decision === 'proceed' ? 5 : 4)
        await expectState(page, bothDeep)
        await expectData(page, bothDeep)
        expect(await page.evaluate(() => history.length)).toBe(length + 2)
      })
    }

    for (const cancelBack of [false, true]) {
      it(`keeps both entries when a blocked second deep push is cancelled before the accepted loader finishes (cancel Back: ${cancelBack})`, async ({
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
        expect(await page.evaluate(() => history.length)).toBe(length + 2)
        await page.locator('#block-navigation').uncheck()
        await page.goBack()
        await expectState(page, qOnly)
        await releaseLoader(page, 2)
        await expectData(page, qOnly)
        await page.goBack()
        await expectState(page, initial)
        await expectData(page, initial)
        await page.goForward()
        await releaseLoader(page, 3)
        await expectData(page, qOnly)
        await page.goForward()
        await releaseLoader(page, 4)
        await expectState(page, bothDeep)
        await expectData(page, bothDeep)
        expect(await page.evaluate(() => history.length)).toBe(length + 2)
      })
    }

    it('keeps every entry when deep and shallow pushes alternate', async ({
      page
    }) => {
      await navigateTo(
        page,
        path,
        '?q=init&page=1&qHistory=push&pageHistory=push&panelHistory=push'
      )
      await expectData(page, initial)
      const index = await readHistoryIndex(page)
      const length = await page.evaluate(() => history.length)
      await page.locator('#set-q').click()
      await expectRequests(page, 1)
      await expectState(page, qOnly)
      await page.locator('#panel-before').click()
      await expectState(page, { ...qOnly, panel: 'before' })
      await page.locator('#set-page').click()
      await expectRequests(page, 2)
      await expectState(page, { ...bothDeep, panel: 'before' })
      await page.locator('#panel-open').click()
      const latest = { ...bothDeep, panel: 'open' }
      await expectState(page, latest)
      expect(await page.evaluate(() => history.length)).toBe(length + 4)
      await releaseLoader(page, 2)
      await expectData(page, { ...bothDeep, panel: 'before' })
      await releaseRequests(page, [1])
      await expectState(page, latest)
      await expectData(page, { ...bothDeep, panel: 'before' })
      await expectRequests(page, 2)
      expect(await readHistoryIndex(page)).toBe(index + 4)
      expect(await page.evaluate(() => history.length)).toBe(length + 4)
      await page.goBack()
      await releaseLoader(page, 3)
      await expectState(page, { ...bothDeep, panel: 'before' })
      await expectData(page, { ...bothDeep, panel: 'before' })
      await page.goBack()
      await releaseLoader(page, 4)
      await expectState(page, { ...qOnly, panel: 'before' })
      await expectData(page, { ...qOnly, panel: 'before' })
      await page.goBack()
      await releaseLoader(page, 5)
      await expectState(page, qOnly)
      await expectData(page, qOnly)
      await page.goBack()
      await expectState(page, initial)
      await expectData(page, initial)
      expect(await readHistoryIndex(page)).toBe(index)
    })

    it('batches same-tick push setters into one URL entry', async ({
      page
    }) => {
      await navigateTo(
        page,
        path,
        '?q=init&page=1&qHistory=push&pageHistory=push'
      )
      await expectData(page, initial)
      const length = await page.evaluate(() => history.length)
      await page.locator('#set-both').click()
      await expectRequests(page, 1)
      await expectState(page, bothDeep)
      expect(await page.evaluate(() => history.length)).toBe(length + 1)
      await releaseLoader(page, 1)
      await expectData(page, bothDeep)
      await expectRequests(page, 1)
      expect(await page.evaluate(() => history.length)).toBe(length + 1)
      await page.goBack()
      await expectState(page, initial)
      await expectData(page, initial)
    })

    it('drops forward entries when a new push follows Back during a loader', async ({
      page
    }) => {
      await navigateTo(
        page,
        path,
        '?q=init&page=1&qHistory=push&pageHistory=push&panelHistory=push'
      )
      await expectData(page, initial)
      const index = await readHistoryIndex(page)
      const length = await page.evaluate(() => history.length)
      await page.locator('#set-q').click()
      await expectRequests(page, 1)
      await expectState(page, qOnly)
      await page.locator('#panel-open').click()
      await expectState(page, { ...qOnly, panel: 'open' })
      await page.goBack()
      await expectState(page, qOnly)
      await expectRequests(page, 2)
      await page.locator('#set-page').click()
      await releaseLoader(page, 3)
      await expectState(page, bothDeep)
      await expectData(page, bothDeep)
      await releaseRequests(page, [1, 2])
      await expectState(page, bothDeep)
      await expectData(page, bothDeep)
      expect(await readHistoryIndex(page)).toBe(index + 2)
      expect(await page.evaluate(() => history.length)).toBe(length + 2)
      await page.goBack()
      await releaseLoader(page, 4)
      await expectState(page, qOnly)
      await expectData(page, qOnly)
      await page.goForward()
      await releaseLoader(page, 5)
      await expectState(page, bothDeep)
      await expectData(page, bothDeep)
      expect(await page.evaluate(() => history.length)).toBe(length + 2)
    })

    for (const secondKey of ['page', 'panel'] as const) {
      it(`keeps Back and Forward entries before loaders finish (${secondKey})`, async ({
        page
      }) => {
        await navigateTo(
          page,
          path,
          '?q=init&page=1&qHistory=push&pageHistory=push&panelHistory=push'
        )
        await expectData(page, initial)
        const index = await readHistoryIndex(page)
        const length = await page.evaluate(() => history.length)
        await page.locator('#set-q').click()
        await expectRequests(page, 1)
        await expectState(page, qOnly)
        await page
          .locator(secondKey === 'page' ? '#set-page' : '#panel-open')
          .click()
        const latest =
          secondKey === 'page' ? bothDeep : { ...qOnly, panel: 'open' }
        await expectState(page, latest)
        await expectRequests(page, secondKey === 'page' ? 2 : 1)
        await page.goBack()
        await expectState(page, qOnly)
        await expectRequests(page, secondKey === 'page' ? 3 : 2)
        expect(await readHistoryIndex(page)).toBe(index + 1)
        await page.goForward()
        await expectState(page, latest)
        const forwardRequest = secondKey === 'page' ? 4 : 3
        await releaseLoader(page, forwardRequest)
        await expectData(page, latest)
        await releaseRequests(page, secondKey === 'page' ? [1, 2, 3] : [1, 2])
        await expectState(page, latest)
        await expectData(page, latest)
        expect(await readHistoryIndex(page)).toBe(index + 2)
        expect(await page.evaluate(() => history.length)).toBe(length + 2)
        expect(
          await page.evaluate(() =>
            window.pendingLoaderControl!.requests.map(
              request => request.aborted
            )
          )
        ).toEqual(
          secondKey === 'page' ? [true, true, true, false] : [true, true, false]
        )
        await page.goBack()
        await releaseLoader(page, forwardRequest + 1)
        await expectData(page, qOnly)
        await expectState(page, qOnly)
        await page.goBack()
        await expectData(page, initial)
        await expectState(page, initial)
      })
    }

    for (const firstHistory of ['replace', 'push'] as const) {
      for (const secondKey of ['page', 'panel'] as const) {
        const secondHistory = firstHistory === 'push' ? 'replace' : 'push'
        it(`keeps one added entry for ${firstHistory} then ${secondHistory} (${secondKey})`, async ({
          page
        }) => {
          await navigateTo(
            page,
            path,
            `?q=init&page=1&qHistory=${firstHistory}&pageHistory=${secondHistory}&panelHistory=${secondHistory}`
          )
          await expectData(page, initial)
          const index = await readHistoryIndex(page)
          const length = await page.evaluate(() => history.length)
          await page.locator('#set-q').click()
          await expectRequests(page, 1)
          await expectState(page, qOnly)
          await page
            .locator(secondKey === 'page' ? '#set-page' : '#panel-open')
            .click()
          const latest =
            secondKey === 'page' ? bothDeep : { ...qOnly, panel: 'open' }
          await expectState(page, latest)
          expect(await page.evaluate(() => history.length)).toBe(length + 1)
          await releaseLoader(page, secondKey === 'page' ? 2 : 1)
          await expectData(page, secondKey === 'page' ? latest : qOnly)
          await expectState(page, latest)
          expect(await readHistoryIndex(page)).toBe(index + 1)
          expect(await page.evaluate(() => history.length)).toBe(length + 1)
          await page.goBack()
          const previous = firstHistory === 'push' ? initial : qOnly
          await expectState(page, previous)
          if (firstHistory === 'replace') {
            await releaseLoader(page, secondKey === 'page' ? 3 : 2)
          }
          await expectData(page, previous)
          expect(await readHistoryIndex(page)).toBe(index)
        })
      }
    }

    for (const secondKey of ['page', 'panel'] as const) {
      it(`keeps both push entries when the first loader has settled (${secondKey})`, async ({
        page
      }) => {
        await navigateTo(
          page,
          path,
          '?q=init&page=1&qHistory=push&pageHistory=push&panelHistory=push'
        )
        await expectData(page, initial)
        const length = await page.evaluate(() => history.length)
        await page.locator('#set-q').click()
        await releaseLoader(page, 1)
        await expectState(page, qOnly)
        await expectData(page, qOnly)
        await page
          .locator(secondKey === 'page' ? '#set-page' : '#panel-open')
          .click()
        const latest =
          secondKey === 'page' ? bothDeep : { ...qOnly, panel: 'open' }
        await expectState(page, latest)
        if (secondKey === 'page') {
          await releaseLoader(page, 2)
        }
        await expectData(page, secondKey === 'page' ? latest : qOnly)
        await expectRequests(page, secondKey === 'page' ? 2 : 1)
        expect(await page.evaluate(() => history.length)).toBe(length + 2)
        await page.goBack()
        await expectState(page, qOnly)
        await releaseLoader(page, secondKey === 'page' ? 3 : 2)
        await expectData(page, qOnly)
        await page.goBack()
        await expectState(page, initial)
        await expectData(page, initial)
      })
    }

    it('keeps a deep push and a shallow push without another loader or commit entry', async ({
      page
    }) => {
      await navigateTo(
        page,
        path,
        '?q=init&page=1&qHistory=push&panelHistory=push'
      )
      await expectData(page, initial)
      const index = await readHistoryIndex(page)
      const length = await page.evaluate(() => history.length)
      await page.locator('#set-q').click()
      await expectRequests(page, 1)
      await expectState(page, qOnly)
      await page.locator('#panel-open').click()
      const withPanel = { ...qOnly, panel: 'open' }
      await expectState(page, withPanel)
      expect(await page.evaluate(() => history.length)).toBe(length + 2)
      await expectRequests(page, 1)
      await expect(page.locator('#loader-data')).toHaveText(
        JSON.stringify(initial)
      )
      await expect(page.locator('#navigation-state')).toHaveText('loading')
      await releaseLoader(page, 1)
      await expectData(page, qOnly)
      await expectState(page, withPanel)
      expect(await readHistoryIndex(page)).toBe(index + 2)
      expect(await page.evaluate(() => history.length)).toBe(length + 2)
      await page.goBack()
      await expectState(page, qOnly)
      await releaseLoader(page, 2)
      await expectData(page, qOnly)
      expect(await readHistoryIndex(page)).toBe(index + 1)
      await page.goBack()
      await expectState(page, initial)
      await expectData(page, initial)
      await page.goForward()
      await releaseLoader(page, 3)
      await expectState(page, qOnly)
      await expectData(page, qOnly)
      await page.goForward()
      await releaseLoader(page, 4)
      await expectState(page, withPanel)
      await expectData(page, withPanel)
      expect(await readHistoryIndex(page)).toBe(index + 2)
      expect(await page.evaluate(() => history.length)).toBe(length + 2)
    })

    it('keeps both deep push entries when the first loader finishes last', async ({
      page
    }) => {
      await navigateTo(
        page,
        path,
        '?q=init&page=1&qHistory=push&pageHistory=push'
      )
      await expectData(page, initial)
      const index = await readHistoryIndex(page)
      const length = await page.evaluate(() => history.length)
      await page.locator('#set-q').click()
      await expectRequests(page, 1)
      await expectState(page, qOnly)
      await page.locator('#set-page').click()
      await expectRequests(page, 2)
      await expectState(page, bothDeep)
      expect(await page.evaluate(() => history.length)).toBe(length + 2)
      await releaseLoader(page, 2)
      await expectData(page, bothDeep)
      await releaseRequests(page, [1])
      await expect
        .poll(() => page.evaluate(() => window.pendingLoaderControl!.completed))
        .toEqual([2, 1])
      await expectState(page, bothDeep)
      expect(await readHistoryIndex(page)).toBe(index + 2)
      expect(await page.evaluate(() => history.length)).toBe(length + 2)
      await page.goBack()
      await expectState(page, qOnly)
      await releaseLoader(page, 3)
      await expectData(page, qOnly)
      expect(await readHistoryIndex(page)).toBe(index + 1)
      await page.goBack()
      await expectState(page, initial)
      await expectData(page, initial)
      expect(await readHistoryIndex(page)).toBe(index)
      await page.goForward()
      await releaseLoader(page, 4)
      await expectState(page, qOnly)
      await expectData(page, qOnly)
      await page.goForward()
      await releaseLoader(page, 5)
      await expectState(page, bothDeep)
      await expectData(page, bothDeep)
      expect(await readHistoryIndex(page)).toBe(index + 2)
      expect(await page.evaluate(() => history.length)).toBe(length + 2)
    })
  }
)
