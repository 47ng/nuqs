import { Description } from '@/src/components/typography'
import { Separator } from '@/src/components/ui/separator'
import type { SearchParams } from 'nuqs/server'
import { Suspense } from 'react'
import { SourceOnGitHub } from '../_components/source-on-github'
import { getMetadata } from '../demos'
import { fetchProducts, pageCount } from './api'
import { ClientPaginationControls } from './pagination-controls.client'
import { ServerPaginationControls } from './pagination-controls.server'
import { ProductView } from './product'
import { RenderingControls } from './rendering-controls'
import { searchParamsCache } from './searchParams'

export const metadata = getMetadata('pagination')

type PageProps = {
  searchParams: SearchParams
}

export default async function PaginationDemoPage({ searchParams }: PageProps) {
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(searchParams)
  return (
    <>
      <h1>{metadata.title}</h1>
      <Description>{metadata.description}</Description>
      <h2>Rendering controls</h2>
      <Suspense>
        <RenderingControls />
      </Suspense>
      <Separator className="my-8" />
      <PaginationRenderer />
      <Suspense>
        <ProductSection />
      </Suspense>
      <SourceOnGitHub path="pagination/searchParams.ts" />
      <SourceOnGitHub path="pagination/page.tsx" />
      <SourceOnGitHub path="pagination/pagination-controls.server.tsx" />
      <SourceOnGitHub path="pagination/pagination-controls.client.tsx" />
    </>
  )
}

function PaginationRenderer() {
  // Showcasing the use of search params cache in nested RSCs
  const renderOn = searchParamsCache.get('renderOn')
  return (
    <>
      <h2>
        Pagination controls{' '}
        <small className="text-sm font-medium text-zinc-500">
          ({renderOn}-rendered)
        </small>
      </h2>
      {renderOn === 'server' && (
        <ServerPaginationControls numPages={pageCount} />
      )}
      <Suspense key="client">
        {renderOn === 'client' && (
          <ClientPaginationControls numPages={pageCount} />
        )}
      </Suspense>
    </>
  )
}

async function ProductSection() {
  const { page, delay } = searchParamsCache.all()
  const products = await fetchProducts(page, delay)
  return (
    <section>
      <h2>
        Product list{' '}
        <small className="text-sm font-medium text-zinc-500">
          (server-rendered)
        </small>
      </h2>
      {products.map(product => (
        <ProductView product={product} key={product.id} />
      ))}
    </section>
  )
}
