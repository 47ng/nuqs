import { paramsCache } from './params-cache'

export default function Layout({ children }: { children: React.ReactNode }) {
  const slug = getSlug()
  return (
    <>
      <Pre />
      <div>Out {slug}</div>
      {children}
      <Post />
    </>
  )
}

function Pre() {
  const slug = getSlug()
  return <div>Pre out {slug}</div>
}

function Post() {
  const slug = getSlug()
  return <div>Post out {slug}</div>
}

function getSlug() {
  let slug = NaN
  try {
    slug = paramsCache.get('slug')
  } catch {
    // Not under the [slug] route
  }
  return slug
}
