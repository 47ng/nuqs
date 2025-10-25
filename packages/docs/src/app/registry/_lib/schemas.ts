import { z } from 'zod'

const registrySourceFileSchema = z.object({
  type: z.literal('registry:file'),
  path: z.string(),
  target: z.string()
})
export type RegistryFile = z.infer<typeof registryBuiltFileSchema>
const registryBuiltFileSchema = registrySourceFileSchema.extend({
  content: z.string()
})

const registryBaseItemSchema = z.object({
  type: z.literal('registry:item'),
  name: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dependencies: z.array(z.string())
})

// Shape of individually built registry-item.json files
export type RegistryItem = z.infer<typeof registryItemSchema>
export const registryItemSchema = registryBaseItemSchema.extend({
  files: z.array(registryBuiltFileSchema)
})

// Shape of the root registry.json file
export const registrySchema = z.object({
  name: z.string(),
  homepage: z.url(),
  items: z.array(
    registryBaseItemSchema.extend({
      files: z.array(registrySourceFileSchema)
    })
  )
})
