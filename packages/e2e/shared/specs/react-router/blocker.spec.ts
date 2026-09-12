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

function testRouterHistory(path: string) {
  for (const mode of ['push', 'replace'] as const) {
    it(`blocks Back after idle shallow pushes and an ordinary router ${mode}`, async ({
      page
    }) => {
      await navigateTo(page, path, '?count=0')
      await page.locator('#enabled').uncheck()
      const before = await page.evaluate(() => history.length)
      await expectTwoShallowPushes(page, 0)
      await page.locator(`#router-${mode}`).click()
      await expectCount(page, 3)
      await expect(page.locator('#navigation')).toHaveText('idle')
      expect(await page.evaluate(() => history.length)).toBe(
        before + (mode === 'push' ? 3 : 2)
      )
      await page.locator('#enabled').check()
      await page.evaluate(() => {
        document.body.dataset.blockerTest = 'mounted'
        history.back()
      })
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectCount(page, 3)
      await page.locator('#cancel').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectCount(page, 3)
      await page.evaluate(() => history.back())
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectCount(page, 3)
      await page.locator('#proceed').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      const previousCount = mode === 'push' ? 2 : 1
      await expectCount(page, previousCount)
      for (const direction of ['forward', 'back'] as const) {
        const from = direction === 'forward' ? previousCount : 3
        const to = direction === 'forward' ? 3 : previousCount
        await page.evaluate(direction => history[direction](), direction)
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectCount(page, from)
        await page.locator('#cancel').click()
        await expect(page.locator('#blocker')).toHaveText('unblocked')
        await expectCount(page, from)
        await page.evaluate(direction => history[direction](), direction)
        await expect(page.locator('#blocker')).toHaveText('blocked')
        await expectCount(page, from)
        await page.locator('#proceed').click()
        await expect(page.locator('#blocker')).toHaveText('unblocked')
        await expectCount(page, to)
      }
      expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
        'mounted'
      )
    })
  }

  it('keeps a separate router entry after a shallow push during confirmation', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    const before = await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      return history.length
    })
    await expectTwoShallowPushes(page, 0)
    await page.locator('#router-push').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 2)
    await shallowPush(page, 3)
    await expect(page.locator('#blocker')).toHaveText('blocked')
    const shallowUrl = page.url()
    expect(await page.evaluate(() => history.length)).toBe(before + 3)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expect(page.locator('#navigation')).toHaveText('idle')
    await expectCount(page, 3)
    await expect(page).toHaveURL(shallowUrl)
    expect(await page.evaluate(() => history.length)).toBe(before + 4)
    await page.evaluate(() => history.back())
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 3)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expect(page.locator('#navigation')).toHaveText('idle')
    await expectCount(page, 3)
    await expect(page).toHaveURL(shallowUrl)
    await page.locator('#enabled').uncheck()
    await page.evaluate(() => history.back())
    await expectCount(page, 2)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  for (const action of ['deep', 'deep-replace'] as const) {
    it(`blocks Back after idle shallow pushes and an accepted ${action}`, async ({
      page
    }) => {
      await navigateTo(page, path, '?count=0')
      await expectTwoShallowPushes(page, 0)
      await page.locator(`#${action}`).click()
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectCount(page, 3)
      await page.locator('#proceed').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expect(page.locator('#navigation')).toHaveText('idle')
      await expectCount(page, 3)
      await page.evaluate(() => {
        document.body.dataset.blockerTest = 'mounted'
        history.back()
      })
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectCount(page, 3)
      await page.locator('#cancel').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectCount(page, 3)
      await page.evaluate(() => history.back())
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectCount(page, 3)
      await page.locator('#proceed').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectCount(page, action === 'deep' ? 2 : 1)
      expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
        'mounted'
      )
    })
  }

  for (const repeatUrl of [false, true]) {
    it(`restores multi-entry Back after a router push (repeat URL: ${repeatUrl})`, async ({
      page
    }) => {
      await navigateTo(page, path, '?count=0')
      await page.locator('#enabled').uncheck()
      await expectTwoShallowPushes(page, 0)
      if (repeatUrl) {
        await page.locator('#shallow-decrement').click()
        await expectCount(page, 1)
      }
      await page.locator('#router-push').click()
      await expectCount(page, 3)
      await expect(page.locator('#navigation')).toHaveText('idle')
      await page.locator('#enabled').check()
      await page.evaluate(() => {
        document.body.dataset.blockerTest = 'mounted'
        history.go(-2)
      })
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectCount(page, 3)
      await page.locator('#proceed').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectCount(page, repeatUrl ? 2 : 1)
      expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
        'mounted'
      )
    })
  }

  it('blocks multi-entry Back after Cancel and blocker remount', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#enabled').uncheck()
    await expectTwoShallowPushes(page, 0)
    await page.locator('#router-push').click()
    await expectCount(page, 3)
    await expect(page.locator('#navigation')).toHaveText('idle')
    await page.locator('#enabled').check()
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.back()
    })
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 3)
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 3)
    await page.locator('#toggle-blocker').click()
    await expect(page.locator('#blocker')).toHaveCount(0)
    await page.locator('#toggle-blocker').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.locator('#enabled').uncheck()
    await page.locator('#enabled').check()
    await page.evaluate(() => history.go(-2))
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 3)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 1)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })

  it('blocks Forward after an allowed Back across shallow pushes and a router push', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#enabled').uncheck()
    await expectTwoShallowPushes(page, 0)
    await page.locator('#router-push').click()
    await expectCount(page, 3)
    await expect(page.locator('#navigation')).toHaveText('idle')
    await page.evaluate(() => {
      document.body.dataset.blockerTest = 'mounted'
      history.back()
    })
    await expectCount(page, 2)
    await page.locator('#enabled').check()
    await page.evaluate(() => history.forward())
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 2)
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 2)
    await page.evaluate(() => history.forward())
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await expectCount(page, 2)
    await page.locator('#proceed').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await expectCount(page, 3)
    expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
      'mounted'
    )
  })
}

export const testBlockerWithoutLoader = defineTest(
  'React Router blockers without loaders',
  ({ path }) => {
    testRouterHistory(path)

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
  testRouterHistory(path)

  for (const { name, control, state } of [
    { name: 'Link loader', control: 'link', state: 'loading' },
    { name: 'POST action', control: 'submit', state: 'submitting' }
  ] as const) {
    it(`adds a router entry after shallow pushes while a ${name} waits`, async ({
      page
    }) => {
      it.setTimeout(10_000)
      await navigateTo(page, path, '?count=0')
      await page.locator('#enabled').uncheck()
      const before = await page.evaluate(() => history.length)
      await expectTwoShallowPushes(page, 0)
      await page.locator(`#router-slow-${control}`).click()
      await expect(page.locator('#navigation')).toHaveText(state)
      await shallowPush(page, 3)
      await shallowPush(page, 4)
      await expect(page.locator('#navigation')).toHaveText(state)
      await expect(page.locator('#navigation')).toHaveText('idle')
      await expectCount(page, 3)
      expect(await page.evaluate(() => history.length)).toBe(before + 5)
      await page.locator('#enabled').check()
      await page.evaluate(() => {
        document.body.dataset.blockerTest = 'mounted'
        history.back()
      })
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectCount(page, 3)
      await page.locator('#cancel').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectCount(page, 3)
      await page.evaluate(() => history.back())
      await expect(page.locator('#blocker')).toHaveText('blocked')
      await expectCount(page, 3)
      await page.locator('#proceed').click()
      await expect(page.locator('#blocker')).toHaveText('unblocked')
      await expectCount(page, 4)
      expect(await page.evaluate(() => document.body.dataset.blockerTest)).toBe(
        'mounted'
      )
    })
  }

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
    expect(await page.evaluate(() => history.length)).toBe(before + 2)
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
    await page.locator('#enabled').uncheck()
    await page.locator('#enabled').check()
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

  it('blocks Back after repeated cancellation and a shallow push', async ({
    page
  }) => {
    await navigateTo(page, path, '?count=0')
    await page.locator('#deep').click()
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
    await page.evaluate(() => history.back())
    await expect(page.locator('#blocker')).toHaveText('blocked')
    await page.locator('#cancel').click()
    await expect(page.locator('#blocker')).toHaveText('unblocked')
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
    await expect(page.locator('#blocker')).toHaveText('unblocked')
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
    await expect(page.locator('#blocker')).toHaveText('unblocked')
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
    await expect(page.locator('#blocker')).toHaveText('unblocked')
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
    await page.locator('#enabled').uncheck()
    await page.locator('#enabled').check()
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
      if (remove === 'cancel') {
        await expect(page.locator('#blocker')).toHaveText('unblocked')
      }
      await shallowPush(page, 3)
      expect(await page.evaluate(() => history.length)).toBe(before + 3)
      await expect(page.locator('#navigation')).toHaveText('idle')
      await expectCount(page, 3)
      expect(await page.evaluate(() => history.length)).toBe(before + 3)
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
      expect(await page.evaluate(() => history.length)).toBe(
        before + (shallow ? 2 : 1)
      )
      await expect(page.locator('#navigation')).toHaveText('idle')
      await expectCount(page, shallow ? 2 : 1)
      expect(await page.evaluate(() => history.length)).toBe(
        before + (shallow ? 2 : 1)
      )
      await expectTwoShallowPushes(page, shallow ? 2 : 1)
    })
  }

  for (const blocked of [false, true]) {
    it(
      blocked
        ? 'keeps each shallow push entry through Proceed'
        : 'keeps each shallow push entry during a pending loader navigation',
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
          expect(await page.evaluate(() => history.length)).toBe(before + 2)
          await page.locator('#proceed').click()
          await expect(page.locator('#blocker')).toHaveText('proceeding')
        }
        await expect(page.locator('#navigation')).toHaveText('loading')
        const count = blocked ? 3 : 2
        await shallowPush(page, count)
        expect(await page.evaluate(() => history.length)).toBe(before + count)
        await expect(page.locator('#navigation')).toHaveText('idle')
        await expect(page.locator('#blocker')).toHaveText('unblocked')
        await expectCount(page, count)
        expect(await page.evaluate(() => history.length)).toBe(before + count)
        await page.locator('#enabled').uncheck()
        for (let previous = count - 1; previous >= 0; previous--) {
          await page.goBack()
          await expectCount(page, previous)
        }
        for (let next = 1; next <= count; next++) {
          await page.goForward()
          await expectCount(page, next)
        }
        await expectCount(page, count)
        await expect(page.locator('#navigation')).toHaveText('idle')
        await expectTwoShallowPushes(page, count)
      }
    )
  }
})
