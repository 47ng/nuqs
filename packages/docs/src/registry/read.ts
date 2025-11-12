import {
  type Registry,
  registryBuiltItemSchema,
  registrySchema,
  type RegistrySourceItem
} from '@/src/registry/schemas'
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

export const registryItemCategories = [
  'Adapters',
  'Parsers',
  'Utilities'
] as const
export type RegistryItemCategory = (typeof registryItemCategories)[number]

export function getRegistryItemCategory(name: string): RegistryItemCategory {
  if (name.startsWith('adapter-')) {
    return 'Adapters'
  } else if (name.startsWith('parseAs')) {
    return 'Parsers'
  } else {
    return 'Utilities'
  }
}

export function categorizeRegistryItems(registry: Registry) {
  const categories: Record<RegistryItemCategory, RegistrySourceItem[]> = {
    Adapters: [],
    Parsers: [],
    Utilities: []
  }
  for (const item of registry.items) {
    const category = getRegistryItemCategory(item.name)
    categories[category].push(item)
  }
  return categories
}
