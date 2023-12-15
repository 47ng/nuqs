import createNextDocsMDX from 'next-docs-mdx/config'
import remarkMdxImages from 'remark-mdx-images'

const withFumaMDX = createNextDocsMDX({
  mdxOptions: {
    remarkPlugins: [remarkMdxImages]
  }
})

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true
}

export default withFumaMDX(config)
