import fs from 'node:fs/promises'
import path from 'node:path'

function prettyBytes(size: number) {
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'unit',
    unit: 'byte',
    notation: 'compact',
    unitDisplay: 'narrow',
    maximumFractionDigits: 1
  })
  return formatter.format(size).replace('K', ' k')
}

export async function BundleSize() {
  const filePath = path.resolve(process.cwd(), '../../packages/nuqs/size.json')
  try {
    const json = await fs.readFile(filePath, 'utf8')
    const [{ size }] = JSON.parse(json)
    return prettyBytes(size)
  } catch (error) {
    console.error(error)
    return 'less than 6 kB'
  }
}
