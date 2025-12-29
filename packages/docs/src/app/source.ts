import { blog as blogPosts, docs, meta } from '@/.source'
import { Item } from 'fumadocs-core/page-tree'
import { InferPageType, loader } from 'fumadocs-core/source'
import { createMDXSource } from 'fumadocs-mdx/runtime/next'

const mdxSource = createMDXSource(docs, meta)

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
  source: createMDXSource(blogPosts, [])
})

export type Page = InferPageType<typeof source>
