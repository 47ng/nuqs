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
import { loadPagination, type PaginationSearchParams } from './search-params'

export const metadata = getMetadata('pagination')

type PageProps = {
  searchParams: Promise<SearchParams>
}

type PaginatedProps = {
  pagination: Promise<PaginationSearchParams>
}

export default async function PaginationDemoPage({ searchParams }: PageProps) {
  // Allow nested RSCs to access the search params (in a type-safe way)
  const pagination = loadPagination(searchParams)
  return (
    <>
      <h1 className="text-foreground my-4 text-3xl font-bold sm:text-4xl">
        {metadata.title}
      </h1>
      <Description className="mb-2">{metadata.description}</Description>
      <h2 className="mb-2 text-xl">Rendering controls</h2>
      <Suspense>
        <RenderingControls />
      </Suspense>
      <Separator className="my-8" />
      <Suspense>
        <PaginationRenderer pagination={pagination} />
      </Suspense>
      <Suspense>
        <ProductSection pagination={pagination} />
      </Suspense>
      <SourceOnGitHub path="pagination/search-params.ts" />
      <SourceOnGitHub path="pagination/page.tsx" />
      <SourceOnGitHub path="pagination/pagination-controls.server.tsx" />
      <SourceOnGitHub path="pagination/pagination-controls.client.tsx" />
    </>
  )
}

async function PaginationRenderer({ pagination }: PaginatedProps) {
  const { renderOn } = await pagination
  return (
    <>
      <h2>
        Pagination controls{' '}
        <small className="text-sm font-medium text-zinc-500">
          ({renderOn}-rendered)
        </small>
      </h2>
      {renderOn === 'server' && (
        <ServerPaginationControls
          numPages={pageCount}
          pagination={pagination}
        />
      )}
      <Suspense key="client">
        {renderOn === 'client' && (
          <ClientPaginationControls numPages={pageCount} />
        )}
      </Suspense>
    </>
  )
}

async function ProductSection({ pagination }: PaginatedProps) {
  const { page, delay } = await pagination
  const products = await fetchProducts(page, delay)
  return (
    <section>
      <h2 className="my-2">
        Product list{' '}
        <small className="text-sm font-medium text-zinc-500">
          (server-rendered)
        </small>
      </h2>
      <div className="space-y-2">
        {products.map(product => (
          <ProductView product={product} key={product.id} />
        ))}
      </div>
    </section>
  )
}
