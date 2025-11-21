#! /usr/bin/env node

import { createHash } from 'node:crypto'
import { glob, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { styleText } from 'node:util'
import { z } from 'zod'
import {
  registrySourceItemSchema,
  type Registry,
  type RegistrySourceFile,
  type RegistrySourceItem
} from './schemas.ts'

// Paths
const __dirname = fileURLToPath(new URL('.', import.meta.url))
const packageRoot = resolve(__dirname, '../../')
const itemsDir = resolve(__dirname, './items')
const remoteDir = resolve(__dirname, './remote')
const registryJson = resolve(packageRoot, 'registry.json')

async function loadItems() {
  const itemFiles = await Array.fromAsync(glob(`${itemsDir}/*.json`))
  return await Promise.all(
    itemFiles.map(async filePath => {
      const item = await loadItem(filePath)
      console.log(`  ${styleText('green', '✔')} %s`, item.name)
      return item
    })
  )
}

async function loadItem(filePath: string) {
  const contents = await readFile(filePath, 'utf-8')
  const item = registrySourceItemSchema.parse(JSON.parse(contents))
  await hydrateItem(item)
  return item
}

async function hydrateItem(item: RegistrySourceItem) {
  async function hydrateFile(file: RegistrySourceFile) {
    if (z.url().safeParse(file.path).success === false) {
      return
    }
    const response = await fetch(file.path)
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file at ${file.path}: ${response.statusText}`
      )
    }
    // This is kind of dumb, but we need to save it to a temporary file
    // so that the `shadcn build` command can do this on the assembled registry.
    const content = await response.text()
    const tempFilePath = resolve(
      remoteDir,
      `${item.name}.${hash(file.path, file.target, content).slice(0, 12)}.txt`
    )
    await writeFile(tempFilePath, content)
    file.path = tempFilePath.replace(packageRoot + '/', '')
  }
  return Promise.all(item.files.map(file => hydrateFile(file)))
}

function hash(...contents: string[]) {
  const hash = createHash('sha256')
  for (const content of contents) {
    hash.update(content)
  }
  return hash.digest('base64url')
}

async function main() {
  console.log(`${styleText('blue', 'i')} Assembling registry...`)
  const items = await loadItems()
  const registry: Registry = {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'nuqs',
    homepage: 'https://nuqs.dev',
    items: items.sort((a, b) => a.name.localeCompare(b.name))
  }
  await writeFile(registryJson, JSON.stringify(registry, null, 2), 'utf-8')
  console.log(
    `${styleText('green', '✔')} Registry assembled successfully (processed %d items)`,
    items.length
  )
}

await main()
