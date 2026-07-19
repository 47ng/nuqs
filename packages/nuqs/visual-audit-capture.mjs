// Usage: node capture.mjs <pages-file> <out-dir>
// Run from a directory where `playwright` is resolvable
// (e.g. <repo>/packages/nuqs). Captures each page from prod and the
// PR preview in three variants: desktop-light, desktop-dark,
// mobile-light (iPhone 16 Pro geometry).
import { readFileSync } from 'node:fs'
import { chromium } from 'playwright'

const [pagesFile, outDir] = process.argv.slice(2)
const pages = readFileSync(pagesFile, 'utf8').trim().split('\n')

const SOURCES = [
  ['prod', 'https://nuqs.dev'],
  ['preview', 'https://nuqs-git-chore-bump-fumadocs-47ng.vercel.app']
]

const VARIANTS = [
  ['desktop-light', { viewport: { width: 1440, height: 900 }, colorScheme: 'light' }],
  ['desktop-dark', { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' }],
  [
    'mobile-light',
    {
      viewport: { width: 402, height: 874 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      colorScheme: 'light'
    }
  ]
]

const slug = path =>
  path === '/' ? 'home' : path.replace(/^\//, '').replaceAll('/', '_')

const browser = await chromium.launch()
const failures = []
for (const [variant, ctxOptions] of VARIANTS) {
  const ctx = await browser.newContext(ctxOptions)
  const page = await ctx.newPage()
  for (const path of pages) {
    for (const [src, base] of SOURCES) {
      const file = `${outDir}/${slug(path)}--${variant}--${src}.png`
      try {
        await page.goto(base + path, { waitUntil: 'networkidle', timeout: 30000 })
      } catch {
        // network never idles on some pages; capture what rendered
      }
      await page.waitForTimeout(500)
      try {
        await page.screenshot({ path: file, fullPage: true })
      } catch (e) {
        try {
          await page.screenshot({ path: file })
        } catch (e2) {
          failures.push(`${path} ${variant} ${src}: ${e2.message}`)
        }
      }
    }
  }
  await ctx.close()
}
await browser.close()
if (failures.length > 0) {
  console.error('FAILURES:\n' + failures.join('\n'))
  process.exit(1)
}
console.log(`captured ${pages.length} pages x ${VARIANTS.length} variants x 2 sources`)
