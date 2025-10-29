import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path/posix'

export async function QuineStatic() {
  // 'use cache'
  const filePath = resolve(process.cwd(), 'src/app/components/quine-static.tsx')
  const source = await readFile(filePath, 'utf-8')
  return <pre>{source}</pre>
}
