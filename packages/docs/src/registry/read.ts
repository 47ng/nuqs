import { registryBuiltItemSchema, registrySchema } from '@/src/registry/schemas'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export async function readRegistry() {
  const fileName = resolve(process.cwd(), 'public/r/registry.json')
  const fileContents = await readFile(fileName, 'utf-8')
  return registrySchema.parse(JSON.parse(fileContents))
}

export async function readRegistryItem(name: string) {
  const fileName = resolve(process.cwd(), `public/r/${name}.json`)
  const fileContents = await readFile(fileName, 'utf-8')
  return registryBuiltItemSchema.parse(JSON.parse(fileContents))
}

export async function readUsage(name: string) {
  try {
    const fileName = resolve(process.cwd(), `src/registry/items/${name}.md`)
    return await readFile(fileName, 'utf-8')
  } catch {
    return null
  }
}
