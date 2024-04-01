import fs from 'node:fs/promises'
import path from 'node:path'
import prettyBytes from 'pretty-bytes'

export async function BundleSize() {
  const filePath = path.resolve(process.cwd(), '../../packages/nuqs/size.json')
  try {
    const json = await fs.readFile(filePath, 'utf8')
    const [{ size }] = JSON.parse(json)
    return prettyBytes(size)
  } catch (error) {
    console.error(error)
    return 'less than 5KB'
  }
}
