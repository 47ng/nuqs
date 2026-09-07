import { expect, test as it, type Page } from '@playwright/test'
import { defineTest } from '../../define-test'
import { navigateTo } from '../../playwright/navigate'

async function expectCount(page: Page, count: number) {
  await expect(page).toHaveURL(
    url => url.searchParams.get('count') === String(count)
  )
  await expect(page.locator('#count')).toHaveText(String(count))
}

async function shallowPush(page: Page, count: number) {
  await page.locator('#shallow').click()
  await expectCount(page, count)
}

async function expectTwoShallowPushes(page: Page, initialCount: number) {
  const before = await page.evaluate(() => history.length)
  await shallowPush(page, initialCount + 1)
  await shallowPush(page, initialCount + 2)
  expect(await page.evaluate(() => history.length)).toBe(before + 2)
}

export const testBlockerWithoutLoader = defineTest(
  'React Router blockers without loaders',
  ({ path }) => {
    it('blocks Back after an open blocker unmounts before a router push', async ({
      page
    }) => {
      await navigateTo(page, path, '?count=0')
      await page.locator('#deep').click()
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await page.locator('#toggle-blocker').click()
      await expect(page.locator('#blocker')).toHaveCount(0)
      await page.locator('#router-push').click()
      await expectCount(page, 3)
      await page.locator('#toggle-blocker').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await page.locator('#enabled').uncheck()
      await page.locator('#enabled').check()
      await page.evaluate(() => {
        document.body.dataset.blockerTest = 'mounted'
        history.back()
      })
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectCount(page, 3)
      await page.locator('#proceed').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectCount(page, 1)
      expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
        'mounted'
      )
    })
  }
)

export const testBlocker = defineTest('React Router blockers', ({ path }) => {
  for (const cancelFirst of [false, true]) {
    it(
      cancelFirst
        ? 'adds two shallow entries after cancelling a blocked deep push'
        : 'adds two idle shallow entries',
      async ({ page }) => {
        await navigateTo(page, path, '?count=0')
        if (cancelFirst) {
          await page.locator('#deep').click()
          await expect(page.locator('#blocker')).toHaveText('blocked')
          await expectCount(page, 1)
          await page.locator('#cancel').click()
          await expect(page.locator('#blocker')).toHaveText('unblocked')
        }
        await expectTwoShallowPushes(page, cancelFirst ? 1 : 0)
        if (cancelFirst) {
          await page.evaluate(() => history.back())
          await expect(page.locator('#blocker')).toHaveText('blocked')
          await expectCount(page, 3)
          await page.locator('#cancel').click()
          await expect(page.locator('#blocker')).toHaveText('unblocked')
          await expectCount(page, 3)
        }
      }
    )
  }

  it('blocks Back after cancelling a blocked deep push without reloading', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.back()
    })
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.evaluate(() => history.back())
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 0)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  it('blocks Back after cancelling repeated deep pushes', async ({ page }) => {
    await navigateTo(page, path, '?count=0')
    const before = await page.evaluate(() => history.length)
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.locator('#deep').click()
    await expectCount(page, 2)
    expect(await page.evaluate(() => history.length)).toBe(before + 1)
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.back()
    })
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 2)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 0)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  for (const shallow of [false, true]) {
    it(`blocks Back after cancelling a deep push and replace (shallow write: ${shallow})`, async ({
      page
    }) => {
      await navigateTo(page, path, '?count=0')
      await page.locator('#deep').click()
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await page.locator('#cancel').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await page.locator('#deep-replace').click()
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectCount(page, 2)
      if (shallow) {
        await shallowPush(page, 3)
      }
      await page.locator('#cancel').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await page.evaluate(() => {
        document.body.dataset.blockerTest = 'mounted'
        history.back()
      })
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectCount(page, shallow ? 3 : 2)
      await page.locator('#proceed').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectCount(page, shallow ? 2 : 0)
      expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
        'mounted'
      )
    })
  }

  for (const shallow of [false, true]) {
    it(`blocks each Back after separate cancelled deep pushes (shallow write: ${shallow})`, async ({
      page
    }) => {
      await navigateTo(page, path, '?count=0')
      await page.evaluate(() => {
        document.body.dataset.blockerTest = 'mounted'
      })
      await page.locator('#deep').click()
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await page.locator('#cancel').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      if (shallow) {
        await shallowPush(page, 2)
      }
      await page.locator('#deep').click()
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await page.locator('#cancel').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      for (let count = shallow ? 3 : 2; count > 0; count--) {
        await page.evaluate(() => history.back())
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectCount(page, count)
        await page.locator('#proceed').click()
        await expect(page.locator('#blocker')).toHaveText('unblocked')
        await expectCount(page, count - 1)
      }
      expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
        'mounted'
      )
    })
  }

  it('blocks Back while the deep push confirmation is open', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.back()
    })
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 1)
    await page.evaluate(() => history.back())
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 0)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  it('blocks Back after a cancelled push followed by an accepted push', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expect(page.locator('#navigation')).toHaveText('idle')
    await expectCount(page, 2)
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.back()
    })
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 2)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 1)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  it('keeps the Back destination when a shallow push occurs during confirmation', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.back()
    })
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await shallowPush(page, 2)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 0)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  it('blocks Back after removing an open blocker and remounting it', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await page.locator('#toggle-blocker').click()
    await expect(page.locator('#blocker')).toHaveCount(0)
    await page.locator('#toggle-blocker').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.back()
    })
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 0)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  for (const shallow of [false, true]) {
    it(`blocks Back after a cancelled push followed by a router push (shallow write: ${shallow})`, async ({
      page
    }) => {
      await navigateTo(page, path, '?count=0')
      await page.locator('#deep').click()
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await page.locator('#cancel').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      if (shallow) {
        await shallowPush(page, 2)
      }
      await page.locator('#router-push').click()
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await page.locator('#proceed').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectCount(page, 3)
      await page.evaluate(() => {
        document.body.dataset.blockerTest = 'mounted'
        history.back()
      })
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectCount(page, 3)
      await page.locator('#proceed').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectCount(page, shallow ? 2 : 1)
      expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
        'mounted'
      )
    })
  }

  it('restores the right entry when shallow updates repeat a URL', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await shallowPush(page, 2)
    await page.locator('#shallow-decrement').click()
    await expectCount(page, 1)
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.go(-2)
    })
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.evaluate(() => history.back())
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 2)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  it('keeps tracking cancellation after index repair', async ({ page }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await page.locator('#cancel').click()
    await page.evaluate(() => history.back())
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await page.locator('#cancel').click()
    await shallowPush(page, 2)
    await page.evaluate(() => history.back())
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 2)
  })

  it('restores and proceeds across multiple shallow entries', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await page.locator('#cancel').click()
    await expectTwoShallowPushes(page, 1)
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.go(-2)
    })
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 3)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 1)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  it('restores across shallow entries created before a cancelled deep push', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await expectTwoShallowPushes(page, 0)
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await page.locator('#cancel').click()
    await page.evaluate(() => history.go(-2))
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 3)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 1)
  })

  it('restores repeated URLs by entry identity', async ({ page }) => {
    await navigateTo(page, path)
    const initialUrl = page.url()
    const before = await page.evaluate(() => history.length)
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.locator('#shallow-decrement').click()
    await expect(page).toHaveURL(initialUrl)
    await expect(page.locator('#count')).toHaveText('0')
    expect(await page.evaluate(() => history.length)).toBe(before + 2)
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.go(-2)
    })
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expect(page).toHaveURL(initialUrl)
    await expect(page.locator('#count')).toHaveText('0')
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expect(page).toHaveURL(initialUrl)
    await expect(page.locator('#count')).toHaveText('0')
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
    await page.locator('#enabled').uncheck()
    await page.goForward()
    await expectCount(page, 1)
    await page.goForward()
    await expect(page).toHaveURL(initialUrl)
    await expect(page.locator('#count')).toHaveText('0')
    expect(await page.evaluate(() => history.length)).toBe(before + 2)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  it('blocks Forward after an allowed Back from a cancelled deep push', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.locator('#cancel').click()
    await page.locator('#enabled').uncheck()
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.back()
    })
    await expectCount(page, 0)
    await page.locator('#enabled').check()
    await page.evaluate(() => history.forward())
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 0)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 1)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  it('proceeds Back after remounting the blocker', async ({ page }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.locator('#toggle-blocker').click()
    await expect(page.locator('#blocker')).toHaveCount(0)
    await page.locator('#toggle-blocker').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.back()
    })
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 0)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  it('handles Cancel while the query controls are unmounted', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 1)
    await page.locator('#toggle-controls').click()
    await expect(page.locator('#count')).toHaveCount(0)
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.locator('#toggle-controls').click()
    await expectCount(page, 1)
    await expectTwoShallowPushes(page, 1)
  })

  for (const remove of ['cancel', 'toggle-blocker']) {
    it(`does not attach an old blocker to an allowed navigation (${remove})`, async ({
      page
    }) => {
      it.setTimeout(10_000)
      await navigateTo(page, path, '?count=0&delay=1000')
      const before = await page.evaluate(() => history.length)
      await page.locator('#deep').click()
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await page.locator('#enabled').uncheck()
      await page.locator('#deep').click()
      await expect(page.locator('#navigation')).toHaveText('loading')
      await expectCount(page, 2)
      await page.locator(`#${remove}`).click()
      await shallowPush(page, 3)
      expect(await page.evaluate(() => history.length)).toBe(before + 1)
      await expect(page.locator('#navigation')).toHaveText('idle')
      await expectCount(page, 3)
      expect(await page.evaluate(() => history.length)).toBe(before + 1)
      await expectTwoShallowPushes(page, 3)
    })
  }

  for (const shallow of [false, true]) {
    it(`keeps a proceeding navigation after removing its blocker (shallow write: ${shallow})`, async ({
      page
    }) => {
      it.setTimeout(10_000)
      await navigateTo(page, path, '?count=0&delay=1000')
      const before = await page.evaluate(() => history.length)
      await page.locator('#deep').click()
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await page.locator('#proceed').click()
      await expect(page.locator('#navigation')).toHaveText('loading')
      await page.locator('#toggle-blocker').click()
      await expect(page.locator('#blocker')).toHaveCount(0)
      if (shallow) {
        await shallowPush(page, 2)
      }
      expect(await page.evaluate(() => history.length)).toBe(before + 1)
      await expect(page.locator('#navigation')).toHaveText('idle')
      await expectCount(page, shallow ? 2 : 1)
      expect(await page.evaluate(() => history.length)).toBe(before + 1)
      await expectTwoShallowPushes(page, shallow ? 2 : 1)
    })
  }

  for (const blocked of [false, true]) {
    it(
      blocked
        ? 'keeps shallow pushes in the pending entry through Proceed'
        : 'keeps shallow pushes in a pending loader navigation',
      async ({ page }) => {
        it.setTimeout(10_000)
        await navigateTo(page, path, '?count=0&delay=1000')
        const before = await page.evaluate(() => history.length)
        if (!blocked) {
          await page.locator('#enabled').uncheck()
        }
        await page.locator('#deep').click()
        await expectCount(page, 1)
        if (blocked) {
          await expect(page.locator('#blocker')).toHaveText('blocked')
          await shallowPush(page, 2)
          expect(await page.evaluate(() => history.length)).toBe(before + 1)
          await page.locator('#proceed').click()
          await expect(page.locator('#blocker')).toHaveText('proceeding')
        }
        await expect(page.locator('#navigation')).toHaveText('loading')
        const count = blocked ? 3 : 2
        await shallowPush(page, count)
        expect(await page.evaluate(() => history.length)).toBe(before + 1)
        await expect(page.locator('#navigation')).toHaveText('idle')
        await expect(page.locator('#blocker')).toHaveText('unblocked')
        await expectCount(page, count)
        expect(await page.evaluate(() => history.length)).toBe(before + 1)
        await page.locator('#enabled').uncheck()
        await page.goBack()
        await expectCount(page, 0)
        await page.goForward()
        await expectCount(page, count)
        await expect(page.locator('#navigation')).toHaveText('idle')
        await expectTwoShallowPushes(page, count)
      }
    )
  }
})
