import { z } from 'zod'

// Shared schemas --

const registryBaseItemSchema = z.object({
  type: z.literal('registry:item'),
  name: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dependencies: z.array(z.string()),
  categories: z.array(z.string()).optional(),
  author: z.string().optional()
})

// Source schemas --

export type RegistrySourceFile = z.infer<typeof registrySourceFileSchema>
const registrySourceFileSchema = z.object({
  type: z.literal('registry:file'),
  path: z.string(),
  target: z.string()
})

export type RegistrySourceItem = z.infer<typeof registrySourceItemSchema>
export const registrySourceItemSchema = registryBaseItemSchema.extend({
  files: z.array(registrySourceFileSchema)
})

// Shape of the root registry.json file
export type Registry = z.infer<typeof registrySchema>
export const registrySchema = z.object({
  $schema: z.url(),
  name: z.string(),
  homepage: z.url(),
  items: z.array(registrySourceItemSchema)
})

// Built schemas --

export type RegistryBuiltFile = z.infer<typeof registryBuiltFileSchema>
const registryBuiltFileSchema = registrySourceFileSchema.extend({
  content: z.string()
})

export type RegistryBuiltItem = z.infer<typeof registryBuiltItemSchema>
export const registryBuiltItemSchema = registryBaseItemSchema.extend({
  files: z.array(registryBuiltFileSchema),
  docs: z.string()
})
