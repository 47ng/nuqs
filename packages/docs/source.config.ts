import { rehypeCode } from 'fumadocs-core/mdx-plugins'
import { defineConfig, defineDocs } from 'fumadocs-mdx/config'
import remarkSmartypants from 'remark-smartypants'

export default defineConfig({
  lastModifiedTime: 'git',
  mdxOptions: {
    remarkPlugins: [remarkSmartypants],
    rehypePlugins: [rehypeCode],
    rehypeCodeOptions: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      },
      inline: 'tailing-curly-colon'
    }
  }
})

export const { docs, meta } = defineDocs()
