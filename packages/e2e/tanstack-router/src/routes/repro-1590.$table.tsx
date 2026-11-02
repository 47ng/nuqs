// Regression test for https://github.com/47ng/nuqs/issues/1590
//
// On a route with a dynamic path segment, `updateUrl` used to navigate with
// `to: pathname + renderQueryString(search)`. TanStack Router treats `to` as
// a path template to match against the route tree, so the glued-on query
// string got consumed as the `$table` segment's value instead of being split
// off the path. The router then still resolved this route and appended its
// own search (built from `validateSearch`'s defaults) after ours, producing
// a doubled, malformed query string such as:
//   /repro-1590/customers?schema=public&limit=25&view=structure?schema=public&limit=50&view=data
import { createFileRoute } from '@tanstack/react-router'
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState
} from 'nuqs'

// `schema` & `limit` are never set by this page: they only need a
// `validateSearch` default, so that a route resolved *without* the search
// params we sent (the bug) shows up as defaults leaking into the URL
// (`limit` reverting from 25 to its default of 50).
//
// This intentionally uses a plain `validateSearch` function (as in the
// original report and TSR's own docs), not nuqs's `createStandardSchemaV1`:
// TSR only merges a route's `validateSearch` defaults into the *matched*
// search object via its search-middleware chain, and `~standard`-based
// validators go through a different branch there. A plain function is what
// actually exercises the code path that produced the doubled query string
// in https://github.com/47ng/nuqs/issues/1590.
const searchParams = {
  schema: parseAsString.withDefault('public'),
  limit: parseAsInteger.withDefault(50),
  view: parseAsStringLiteral(['data', 'structure']).withDefault('data')
}

export const Route = createFileRoute('/repro-1590/$table')({
  validateSearch: search => ({
    schema: searchParams.schema.parse(String(search.schema ?? '')) ?? 'public',
    limit: searchParams.limit.parse(String(search.limit ?? '')) ?? 50,
    view: searchParams.view.parse(String(search.view ?? '')) ?? 'data'
  }),
  component: Repro1590
})

function Repro1590() {
  const { table } = Route.useParams()
  const [view, setView] = useQueryState('view', searchParams.view)
  return (
    <div>
      <p id="table">{table}</p>
      <p id="view">{view}</p>
      <button onClick={() => setView('structure')}>Set view=structure</button>
    </div>
  )
}
