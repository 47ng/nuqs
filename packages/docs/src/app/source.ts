import { blog as blogPosts, docs, meta } from '@/.source'
import { loader } from 'fumadocs-core/source'
import { createMDXSource } from 'fumadocs-mdx'

export const source = loader({
  baseUrl: '/docs',
  source: createMDXSource(docs, meta)
})

export const blog = loader({
  baseUrl: '/blog',
  source: createMDXSource(blogPosts, [])
})
