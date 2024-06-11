import { paramsCache } from '../params-cache'

type LayoutProps = {
  children: React.ReactNode
  params: {
    slug: string
  }
}

export default function Layout({ children, params }: LayoutProps) {
  const { slug } = paramsCache.parse(params)
  return (
    <>
      <Pre />
      <div>{slug}</div>
      {children}
      <Post />
    </>
  )
}

function Pre() {
  const slug = paramsCache.get('slug')
  return <div>Pre in {slug}</div>
}

function Post() {
  const slug = paramsCache.get('slug')
  return <div>Post in {slug}</div>
}

export async function generateStaticParams() {
  return [{ slug: '1' }, { slug: '2' }]
}
