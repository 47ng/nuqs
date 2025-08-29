import { CodeBlock } from '@/src/components/code-block'
import { readFile } from 'node:fs/promises'

export async function ZodCodecsSource() {
  const filePath =
    process.cwd() + '/content/docs/parsers/community/zod-codecs.lib.ts'
  const source = await readFile(filePath, 'utf8')
  return <CodeBlock code={source} />
}
