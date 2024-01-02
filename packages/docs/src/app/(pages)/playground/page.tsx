import Link from 'next/link'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export default async function PlaygroundIndexPage() {
  const appRouterLinks = await getDemoLinks()
  return (
    <>
      <h1>Playground</h1>
      <h2>Demos</h2>
      <h3>App router</h3>
      <ul>
        {appRouterLinks.map(link => (
          <li key={link}>
            <Link href={link}>{link.split('/').at(-1)}</Link>
          </li>
        ))}
      </ul>
      <h3>Pages router</h3>
      <ul>
        <li>
          <Link href="/playground/pages/server-side-counter">
            Server-side counter (with gSSP)
          </Link>
        </li>
      </ul>
      <hr />
      <footer>
        Made by <a href="https://francoisbest.com">François Best</a> • Follow my
        work on <a href="https://github.com/franky47">GitHub</a> and{' '}
        <a href="https://mamot.fr/@Franky47">Mastodon</a> •{' '}
        <a href="mailto:freelance@francoisbest.com">Hire me!</a>
      </footer>
    </>
  )
}

async function getDemoLinks() {
  const filePath = fileURLToPath(import.meta.url)
  const dirname = path.dirname(filePath)
  const demos = await fs.readdir(dirname)
  return demos
    .filter(dir => !dir.startsWith('_'))
    .map(dir => `/playground/${dir}`)
}
