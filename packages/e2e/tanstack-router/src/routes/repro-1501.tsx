import { Link as TanStackLink, createFileRoute } from '@tanstack/react-router'
import { LinkProvider, type LinkProps } from 'e2e-shared/components/link'
import { Repro1501 } from 'e2e-shared/specs/repro-1501'

function Link({ href: _, ...props }: LinkProps) {
  return (
    <TanStackLink
      to="."
      search={search => ({ ...search, folder: 'abc' })}
      {...props}
    />
  )
}

function useRouterValue() {
  return Route.useSearch({ select: search => search.folder ?? null })
}

function Page() {
  return (
    <LinkProvider Link={Link}>
      <Repro1501 useRouterValue={useRouterValue} />
    </LinkProvider>
  )
}

export const Route = createFileRoute('/repro-1501')({
  validateSearch: search => ({
    folder: typeof search.folder === 'string' ? search.folder : undefined
  }),
  component: Page
})
