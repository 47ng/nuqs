import { rehypeCode } from 'fumadocs-core/mdx-plugins'
import {
  defineCollections,
  defineConfig,
  defineDocs,
  frontmatterSchema
} from 'fumadocs-mdx/config'
import remarkSmartypants from 'remark-smartypants'
import { z } from 'zod'
import { rehypeCodeOptions } from './rehype-code.config'

export default defineConfig({
  lastModifiedTime: 'git',
  mdxOptions: {
    remarkPlugins: [remarkSmartypants],
    rehypePlugins: [rehypeCode],
    rehypeCodeOptions
  }
})

export const { docs, meta } = defineDocs()

export const blog = defineCollections({
  dir: 'content/blog',
  schema: frontmatterSchema.extend({
    author: z.string(),
    date: z.string().date().or(z.date()).optional()
  }),
  type: 'doc'
})
