import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Suspense } from 'react'
import { codeToHtml } from 'shikiji'
import { Demo } from './demo.client'

export async function LandingDemo() {
  const demoFilePath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    './demo.client.tsx'
  )
  const demoFile = await fs.readFile(demoFilePath, 'utf8')
  const demoCode = await codeToHtml(
    demoFile
      .split('\n')
      .filter(line => !line.includes('className="'))
      .join('\n')
      .replaceAll('next-usequerystate', 'nuqs'),
    {
      lang: 'tsx',
      themes: {
        dark: 'github-dark',
        light: 'github-light'
      },
      transformers: [
        {
          name: 'transparent background',
          pre(node) {
            if (typeof node.properties.style !== 'string') {
              return node
            }
            node.properties.style = node.properties.style
              .split(';')
              .filter(style => !style.includes('-bg:'))
              .concat([
                '--shiki-dark-bg:transparent',
                '--shiki-light-bg:transparent'
              ])
              .join(';')
            return node
          }
        }
      ]
    }
  )
  return (
    <>
      <Suspense
        fallback={
          <div className="mb-4 h-10 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />
        }
      >
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Demo />
        </div>
      </Suspense>
      <div
        className="overflow-x-auto rounded-lg border bg-background p-3 text-xs shadow-inner dark:bg-zinc-900 sm:text-sm"
        dangerouslySetInnerHTML={{ __html: demoCode }}
      />
    </>
  )
}
