import { blog } from '@/src/app/source'
import { Description } from '@/src/components/typography'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/src/components/ui/breadcrumb'
import { Card } from 'fumadocs-ui/components/card'
import { RssIcon } from 'lucide-react'
import Link from 'next/link'
import { ComponentProps } from 'react'
import { getBlogPosts } from './_lib/source'

export const dynamic = 'force-static'

export default async function BlogIndexPage() {
  const posts = getBlogPosts()
  return (
    <>
      <Breadcrumb className="container mt-8 max-w-[900px] md:px-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Blog</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="container max-w-[900px] py-12 md:px-8">
        <nav className="mb-4 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
            Blog
          </h1>
          <RssFeedLink />
        </nav>
        <Description>URL state management with nuqs</Description>
      </div>
      <ul className="container max-w-[900px] space-y-4 pb-24 lg:px-4">
        {posts.map(post => (
          <BlogPostLink post={post} key={post.url} />
        ))}
      </ul>
    </>
  )
}

type BlogPostLinkProps = ComponentProps<'li'> & {
  post: ReturnType<typeof blog.getPages>[number]
}

function BlogPostLink({ post, ...props }: BlogPostLinkProps) {
  return (
    <li {...props}>
      <Card
        title={post.data.title}
        href={post.url}
        description={
          <span className="flex flex-wrap gap-2">
            <span>{post.data.description}</span>
            {post.data.date ? (
              <span className="ml-auto">
                <time dateTime={new Date(post.data.date).toISOString()}>
                  <span className="sr-only">Published on </span>
                  {new Date(post.data.date).toLocaleDateString('en-GB', {
                    dateStyle: 'long'
                  })}
                </time>
              </span>
            ) : (
              <span className="ml-auto">
                <em>Draft</em>
              </span>
            )}
          </span>
        }
      />
    </li>
  )
}

// --

function RssFeedLink() {
  return (
    <a
      href="/blog/rss.xml"
      className="flex items-center gap-1 text-sm text-muted-foreground hover:underline"
    >
      <RssIcon className="size-4 text-orange-500" role="presentation" />
      RSS Feed
    </a>
  )
}
