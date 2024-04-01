import createNextDocsMDX from 'next-docs-mdx/config'
import remarkMdxImages from 'remark-mdx-images'
import remarkSmartypants from 'remark-smartypants'

const withFumaMDX = createNextDocsMDX({
  mdxOptions: {
    remarkPlugins: [remarkMdxImages, remarkSmartypants]
  }
})

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  redirects: async () => {
    return [
      {
        source: '/docs',
        destination: '/docs/installation',
        permanent: false
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/profile_images/**'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/u/**'
      },
      {
        protocol: 'https',
        hostname: 'i.redd.it',
        pathname: '/snoovatar/avatars/**'
      }
    ]
  }
}

export default withFumaMDX(config)
