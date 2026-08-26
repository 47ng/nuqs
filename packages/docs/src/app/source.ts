import { blog as blogPosts, docs } from 'collections/server'
import type { Item } from 'fumadocs-core/page-tree'
import { type InferPageType, loader } from 'fumadocs-core/source'
import { toFumadocsSource } from 'fumadocs-mdx/runtime/server'

const mdxSource = docs.toFumadocsSource()

export const source = loader({
  baseUrl: '/docs',
  source: mdxSource,
  pageTree: {
    // Filter out llm-only pages from the sidebar
    transformers: [
      {
        file(node, filePath): Item {
          if (!filePath) return node
          const file = this.storage.read(filePath)
          if (
            file?.format === 'page' &&
            !file.data.exposeTo?.includes('user')
          ) {
            // @ts-expect-error not an Item, but works at runtime
            return undefined
          }
          return node
        }
      }
    ]
  }
})

// Full source without filtering for llm-full.txt
export const fullSource = loader({
  baseUrl: '/docs',
  source: mdxSource
})

export const blog = loader({
  baseUrl: '/blog',
  source: toFumadocsSource(blogPosts, [])
})

export type Page = InferPageType<typeof source>
