import { expect, test as it, type Page } from '@playwright/test'
import { defineTest } from '../define-test'
import { navigateTo } from '../playwright/navigate'

async function holdFolder(page: Page, id: string) {
  let markStarted!: () => void
  let release!: () => void
  let markFulfilled!: () => void
  const started = new Promise<void>(resolve => {
    markStarted = resolve
  })
  const released = new Promise<void>(resolve => {
    release = resolve
  })
  const fulfilled = new Promise<void>(resolve => {
    markFulfilled = resolve
  })

  await page.route(`**/__mocked__/repro-1501/folders/${id}`, async route => {
    markStarted()
    await released
    await route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: `Contents of folder "${id}"`
    })
    markFulfilled()
  })

  return { started, release, fulfilled }
}

async function expectSyncedState(page: Page, folder: string) {
  await expect(page).toHaveURL(url => url.searchParams.get('folder') === folder)
  await expect(page.locator('#client-router-value:visible')).toHaveText(folder)
  await expect(page.locator('#client-nuqs-value:visible')).toHaveText(folder)
  await expect(page.locator('#client-folder-panel:visible')).toHaveText(
    `Contents of folder "${folder}"`
  )
}

export const testRepro1501 = defineTest('repro-1501', ({ path }) => {
  it('adopts an external URL update after the render suspends', async ({
    page
  }) => {
    const folder = await holdFolder(page, 'abc')
    await navigateTo(page, path)
    const mountToken = page.locator('#client-mount-token:visible')
    await expect(mountToken).toHaveText(/\S+/)
    const initialMountToken = await mountToken.innerText()

    await page.getByRole('link', { name: 'Open folder abc' }).click()
    await folder.started

    await expect(page.locator('#client-folder-panel')).toHaveCount(0)
    await expect(mountToken).toHaveText(initialMountToken)

    folder.release()
    await folder.fulfilled
    await expect(page.locator('#client-loaded-folders:visible')).toHaveText(
      'abc'
    )
    await expectSyncedState(page, 'abc')
    await expect(mountToken).toHaveText(initialMountToken)
  })
})

export const testRepro1501EmitterRace = defineTest(
  'repro-1501 emitter race',
  ({ path }) => {
    it('keeps a newer nuqs update after stale suspended work resolves', async ({
      page
    }) => {
      const abc = await holdFolder(page, 'abc')
      const def = await holdFolder(page, 'def')
      await navigateTo(page, path)
      const mountToken = page.locator('#client-mount-token:visible')
      await expect(mountToken).toHaveText(/\S+/)
      const initialMountToken = await mountToken.innerText()

      await page.getByRole('link', { name: 'Open folder abc' }).click()
      await abc.started

      await page
        .getByRole('button', { name: 'Set folder def with nuqs' })
        .click()
      await def.started
      def.release()
      await def.fulfilled

      await expect(page.locator('#client-loaded-folders:visible')).toHaveText(
        'def'
      )
      await expectSyncedState(page, 'def')
      abc.release()
      await abc.fulfilled
      await expect(page.locator('#client-loaded-folders:visible')).toHaveText(
        'abc,def'
      )
      await expectSyncedState(page, 'def')
      await expect(mountToken).toHaveText(initialMountToken)
    })
  }
)

export const testRepro1501PathnameChange = defineTest(
  'repro-1501 pathname change',
  ({ path }) => {
    it('adopts a destination URL while previous-route work is suspended', async ({
      page
    }) => {
      const abc = await holdFolder(page, 'abc')
      const def = await holdFolder(page, 'def')
      await navigateTo(page, path)
      const mountToken = page.locator('#client-mount-token:visible')
      await expect(mountToken).toHaveText(/\S+/)
      const initialMountToken = await mountToken.innerText()

      await page.getByRole('link', { name: 'Open folder abc' }).click()
      await abc.started

      await page
        .getByRole('link', { name: 'Open folder def on another path' })
        .click()
      await it.step(
        'destination work starts before previous-route work resolves',
        () => def.started
      )
      await expect(page).toHaveURL(
        url =>
          url.pathname.endsWith('/repro-1501/other') &&
          url.searchParams.get('folder') === 'def'
      )
      await expect(mountToken).toHaveText(initialMountToken)

      def.release()
      await def.fulfilled
      await expectSyncedState(page, 'def')

      abc.release()
      await abc.fulfilled
      await expect(page.locator('#client-loaded-folders:visible')).toHaveText(
        'abc,def'
      )
      await expectSyncedState(page, 'def')
      await expect(mountToken).toHaveText(initialMountToken)
    })
  }
)
