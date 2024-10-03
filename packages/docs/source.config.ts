import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
import remarkSmartypants from 'remark-smartypants'

export default defineConfig({
  lastModifiedTime: 'git',
  mdxOptions: {
    remarkPlugins: [remarkSmartypants]
  }
})

export const { docs, meta } = defineDocs()
