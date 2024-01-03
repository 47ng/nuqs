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
        dark: 'dark-plus',
        light: 'light-plus'
      }
    }
  )
  return (
    <>
      <Suspense
        fallback={
          <div className="mb-4 h-10 animate-pulse rounded bg-gray-50 dark:bg-gray-900" />
        }
      >
        <div className="mb-4 flex items-center gap-4">
          <Demo />
        </div>
      </Suspense>
      <div
        className="rounded-lg border bg-white p-3 text-sm shadow-inner dark:bg-[#1e1e1e]"
        dangerouslySetInnerHTML={{ __html: demoCode }}
      />
    </>
  )
}
