import {
  defineCollections,
  defineConfig,
  defineDocs,
  frontmatterSchema
} from 'fumadocs-mdx/config'
import remarkSmartypants from 'remark-smartypants'
import { z } from 'zod'
import { rehypeCodeOptions } from './rehype-code.config'
import { remarkAudience } from './src/lib/remark-audience'

export default defineConfig({
  lastModifiedTime: 'git',
  mdxOptions: {
    remarkPlugins: [remarkSmartypants, remarkAudience],
    rehypeCodeOptions,
    remarkNpmOptions: {
      packageManagers: [
        { name: 'npm', command: () => 'npm i nuqs' },
        { name: 'pnpm', command: () => 'pnpm add nuqs' },
        { name: 'yarn', command: () => 'yarn add nuqs' },
        { name: 'bun', command: () => 'bun add nuqs' },
        { name: 'deno', command: () => 'deno add nuqs' },
        { name: 'vlt', command: () => 'vlt add nuqs' },
        { name: 'nub', command: () => 'nub add nuqs' }
      ]
    }
  }
})

export const { docs, meta } = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: frontmatterSchema.extend({
      exposeTo: z
        .array(z.enum(['user', 'llm']))
        .min(1)
        .default(['user', 'llm'])
    }),
    postprocess: {
      includeProcessedMarkdown: true
    }
  }
})

export const blog = defineCollections({
  dir: 'content/blog',
  schema: frontmatterSchema.extend({
    author: z.string(),
    date: z.string().date().or(z.date()).optional()
  }),
  type: 'doc'
})
