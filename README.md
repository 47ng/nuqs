# useQueryState for Next.js

[![NPM](https://img.shields.io/npm/v/next-usequerystate?color=red)](https://www.npmjs.com/package/next-usequerystate)
[![MIT License](https://img.shields.io/github/license/47ng/next-usequerystate.svg?color=blue)](https://github.com/47ng/next-usequerystate/blob/next/LICENSE)
[![Continuous Integration](https://github.com/47ng/next-usequerystate/workflows/Continuous%20Integration/badge.svg?branch=next)](https://github.com/47ng/next-usequerystate/actions)
[![Coverage Status](https://coveralls.io/repos/github/47ng/next-usequerystate/badge.svg?branch=next)](https://coveralls.io/github/47ng/next-usequerystate?branch=next)
[![Depfu](https://badges.depfu.com/badges/acad53fa2b09b1e435a19d6d18f29af4/count.svg)](https://depfu.com/github/47ng/next-usequerystate?project_id=22104)

useQueryState hook for Next.js - Like React.useState, but stored in the URL query string

## Features

- 🧘‍♀️ Simple: the URL is the source of truth
- 🕰 Replace history or append to use the Back button to navigate state updates
- ⚡️ Built-in parsers for common object types (number, float, boolean, Date, and [more](#parsing))
- ♊️ Linked querystrings with `useQueryStates`
- 🔀 _(beta)_ Supports both the app router (in client components only) and pages router

## Installation

```shell
$ pnpm add next-usequerystate
$ yarn add next-usequerystate
$ npm install next-usequerystate
```

## Usage

```tsx
'use client' // app router: only works in client components

import { useQueryState } from 'next-usequerystate'

export default () => {
  const [name, setName] = useQueryState('name')
  return (
    <>
      <h1>Hello, {name || 'anonymous visitor'}!</h1>
      <input value={name || ''} onChange={e => setName(e.target.value)} />
      <button onClick={() => setName(null)}>Clear</button>
    </>
  )
}
```

![](./useQueryState.gif)

## Documentation

`useQueryState` takes one required argument: the key to use in the query string.

Like `React.useState`, it returns an array with the value present in the query
string as a string (or `null` if none was found), and a state updater function.

Example outputs for our hello world example:

| URL          | name value | Notes                                                             |
| ------------ | ---------- | ----------------------------------------------------------------- |
| `/`          | `null`     | No `name` key in URL                                              |
| `/?name=`    | `''`       | Empty string                                                      |
| `/?name=foo` | `'foo'`    |
| `/?name=2`   | `'2'`      | Always returns a string by default, see [Parsing](#parsing) below |

## Parsing

If your state type is not a string, you must pass a parsing function in the
second argument object.

We provide parsers for common and more advanced object types:

```ts
import {
  parseAsString,
  parseAsInteger,
  parseAsFloat,
  parseAsBoolean,
  parseAsTimestamp,
  parseAsIsoDateTime,
  parseAsArrayOf,
  parseAsJson,
  parseAsStringEnum
} from 'next-usequerystate'

useQueryState('tag') // defaults to string
useQueryState('count', parseAsInteger)
useQueryState('brightness', parseAsFloat)
useQueryState('darkMode', parseAsBoolean)
useQueryState('after', parseAsTimestamp) // state is a Date
useQueryState('date', parseAsIsoDateTime) // state is a Date
useQueryState('array', parseAsArrayOf(parseAsInteger)) // state is number[]
useQueryState('json', parseAsJson<Point>()) // state is a Point

// Enums (string-based only)
enum Direction {
  up = 'UP',
  down = 'DOWN',
  left = 'LEFT',
  right = 'RIGHT'
}

const [direction, setDirection] = useQueryState(
  'direction',
  parseAsStringEnum<Direction>(Object.values(Direction)) // pass a list of allowed values
    .withDefault(Direction.up)
)
```

You may pass a custom set of `parse` and `serialize` functions:

```tsx
import { useQueryState } from 'next-usequerystate'

export default () => {
  const [hex, setHex] = useQueryState('hex', {
    // TypeScript will automatically infer it's a number
    // based on what `parse` returns.
    parse: (query: string) => parseInt(query, 16),
    serialize: value => value.toString(16)
  })
}
```

Example: simple counter stored in the URL:

```tsx
import { useQueryState, parseAsInteger } from 'next-usequerystate'

export default () => {
  const [count, setCount] = useQueryState('count', parseAsInteger)
  return (
    <>
      <pre>count: {count}</pre>
      <button onClick={() => setCount(0)}>Reset</button>
      <button onClick={() => setCount(c => c ?? 0 + 1)}>+</button>
      <button onClick={() => setCount(c => c ?? 0 - 1)}>-</button>
      <button onClick={() => setCount(null)}>Clear</button>
    </>
  )
}
```

## Default value

When the query string is not present in the URL, the default behaviour is to
return `null` as state.

As you saw in the previous example, it makes state updating and UI rendering
tedious.

You can specify a default value to be returned in this case:

```ts
const [count, setCount] = useQueryState('count', parseAsInteger.withDefault(0))

const increment = () => setCount(c => c + 1) // c will never be null
const decrement = () => setCount(c => c - 1) // c will never be null
const clearCount = () => setCount(null) // Remove query from the URL
```

Note: the default value is internal to React, it will **not** be written to the
URL.

Setting the state to `null` will remove the key in the query string and set the
state to the default value.

## Options

### History

By default, state updates are done by replacing the current history entry with
the updated query when state changes.

You can see this as a sort of `git squash`, where all state-changing
operations are merged into a single history value.

You can also opt-in to push a new history item for each state change,
per key, which will let you use the Back button to navigate state
updates:

```ts
// Default: replace current history with new state
useQueryState('foo', { history: 'replace' })

// Append state changes to history:
useQueryState('foo', { history: 'push' })
```

Any other value for the `history` option will fallback to the default.

You can also override the history mode when calling the state updater function:

```ts
const [query, setQuery] = useQueryState('q', { history: 'push' })

// This overrides the hook declaration setting:
setQuery(null, { history: 'replace' })
```

### Shallow

By default, query state updates are done in a _client-first_ manner: there are
no network calls to the server.

This uses the `shallow` option of the Next.js router set to `true`.

To opt-in to query updates notifying the server (to re-run `getServerSideProps`
in the pages router and re-render Server Components on the pages router),
you can set `shallow` to `false`:

```ts
const [state, setState] = useQueryState('foo', { shallow: false })

// You can also pass the option on calls to setState:
setState('bar', { shallow: false })
```

### Scroll

The Next.js router scrolls to the top of the page on navigation updates,
which may not be desirable when updating the query string with local state.

Query state updates won't scroll to the top of the page by default, but you
can opt-in to this behaviour (which was the default up to 1.8.0):

```ts
const [state, setState] = useQueryState('foo', { scroll: true })

// You can also pass the option on calls to setState:
setState('bar', { scroll: true })
```

## Composing parsers, default value & options

You can use a builder pattern to facilitate specifying all of those things:

```ts
useQueryState(
  'counter',
  parseAsInteger
    .withOptions({
      history: 'push',
      shallow: false
    })
    .withDefault(0)
)
```

Note: `withDefault` must always come **after** `withOptions` to ensure proper
type safety (providing a non-nullable state type).

## Multiple Queries (batching)

You can call as many state update function as needed in a single event loop
tick, and they will be applied to the URL asynchronously:

```ts
const MultipleQueriesDemo = () => {
  const [lat, setLat] = useQueryState('lat', parseAsFloat)
  const [lng, setLng] = useQueryState('lng', parseAsFloat)
  const randomCoordinates = React.useCallback(() => {
    setLat(Math.random() * 180 - 90)
    setLng(Math.random() * 360 - 180)
  }, [])
}
```

<!-- todo: All promises of a single update should be the same reference.

If you wish to know when the URL has been updated, you can await the
first returned Promise, which gives you the updated URLSearchParameters
object:

```ts
const randomCoordinates = React.useCallback(() => {
  // Always return the first promise
  const promise = setLat(42)
  // Queue up more state updates **synchronously**
  setLng(12)
  return promise
}, [])

randomCoordinates().then((search: URLSearchParams) => {
  search.get('lat') // 42
  search.get('lng') // 12, has been queued and batch-updated
})
``` -->

For query keys that should always move together, you can use `useQueryStates`
with an object containing each key's type, for a better DX:

```ts
import { useQueryStates, parseAsFloat } from 'next-usequerystate'

const [coordinates, setCoordinates] = useQueryStates(
  {
    lat: parseAsFloat.withDefault(45.18),
    lng: parseAsFloat.withDefault(5.72)
  },
  {
    history: 'push'
  }
)

const { lat, lng } = coordinates

// Set all (or a subset of) the keys in one go:
const search = await setCoordinates({
  lat: Math.random() * 180 - 90,
  lng: Math.random() * 360 - 180
})
```

## Caveats

Because the Next.js pages router is not available in an SSR context, this
hook will always return `null` (or the default value if supplied) on SSR/SSG.

This limitation doesn't apply to the app router.

### Lossy serialization

If your serializer loses precision or doesn't accurately represent
the underlying state value, you will lose this precision when
reloading the page or restoring state from the URL (eg: on navigation).

Example:

```ts
const geoCoordParser = {
  parse: parseFloat,
  serialize: v => v.toFixed(4) // Loses precision
}

const [lat, setLat] = useQueryState('lat', geoCoordParser)
```

Here, setting a latitude of 1.23456789 will render a URL query string
of `lat=1.2345`, while the internal `lat` state will be correctly
set to 1.23456789.

Upon reloading the page, the state will be incorrectly set to 1.2345.

## License

[MIT](https://github.com/47ng/next-usequerystate/blob/next/LICENSE)

- Made with ❤️ by [François Best](https://francoisbest.com)

Using this package at work ? [Sponsor me](https://github.com/sponsors/franky47)
to help with support and maintenance.
