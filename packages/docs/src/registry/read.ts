import {
  type ItemCategory,
  type Registry,
  registryBuiltItemSchema,
  registrySchema,
  type RegistrySourceItem
} from '@/src/registry/schemas'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export async function readRegistry() {
  try {
    const fileName = resolve(process.cwd(), 'public/r/registry.json')
    const fileContents = await readFile(fileName, 'utf-8')
    return [registrySchema.parse(JSON.parse(fileContents)), null] as const
  } catch (error) {
    return [null, error] as const
  }
}

export async function readRegistryItem(name: string) {
  try {
    const fileName = resolve(process.cwd(), `public/r/${name}.json`)
    const fileContents = await readFile(fileName, 'utf-8')
    return [
      registryBuiltItemSchema.parse(JSON.parse(fileContents)),
      null
    ] as const
  } catch (error) {
    return [null, error] as const
  }
}

export async function readUsage(name: string) {
  try {
    const fileName = resolve(process.cwd(), `src/registry/items/${name}.md`)
    return await readFile(fileName, 'utf-8')
  } catch {
    return null
  }
}

export function categorizeRegistryItems(registry: Registry) {
  const categories: Record<ItemCategory, RegistrySourceItem[]> = {
    adapter: [],
    parser: [],
    utility: []
  }
  for (const item of registry.items) {
    if (!item.categories || item.categories.length === 0) {
      categories.utility.push(item)
      continue
    }
    if (item.categories.includes('adapter')) {
      categories.adapter.push(item)
    } else if (item.categories.includes('parser')) {
      categories.parser.push(item)
    } else {
      categories.utility.push(item)
    }
  }
  return categories
}
