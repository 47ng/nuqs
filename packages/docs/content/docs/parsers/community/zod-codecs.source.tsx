import { CodeBlock } from '@/src/components/code-block'
import { readFile } from 'node:fs/promises'

export async function ZodCodecsSource() {
  // note: commented out to fail the build on purpose to show
  // that the error doesn't actually point here.
  // 'use cache'
  // cacheLife('static')
  const filePath =
    process.cwd() + '/content/docs/parsers/community/zod-codecs.lib.ts'
  const source = await readFile(filePath, 'utf8')
  return <CodeBlock code={source.trim()} />
}
