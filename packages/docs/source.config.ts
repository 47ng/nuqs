import { rehypeCode } from 'fumadocs-core/mdx-plugins'
import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
import remarkSmartypants from 'remark-smartypants'
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
