import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path/posix'

export async function QuineDynamic() {
  const filePath = resolve(
    process.cwd(),
    'src/app/components/quine-dynamic.tsx'
  )
  const source = await readFile(filePath, 'utf-8')
  return <pre>{source}</pre>
}
