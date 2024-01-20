import createNextDocsMDX from 'next-docs-mdx/config'
import remarkMdxImages from 'remark-mdx-images'

const withFumaMDX = createNextDocsMDX({
  mdxOptions: {
    remarkPlugins: [remarkMdxImages]
  }
})

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  redirects: async () => [
    {
      source: '/demos/:slug*',
      destination: '/playground/:slug*',
      permanent: true
    }
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '/profile_images/**'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
        pathname: '/dms/image/**'
      }
    ]
  }
}

export default withFumaMDX(config)
