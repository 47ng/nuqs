# useQueryState for Next.js

[![NPM](https://img.shields.io/npm/v/next-usequerystate?color=red)](https://www.npmjs.com/package/next-usequerystate)
[![MIT License](https://img.shields.io/github/license/47ng/next-usequerystate.svg?color=blue)](https://github.com/47ng/next-usequerystate/blob/next/LICENSE)
[![Continuous Integration](https://github.com/47ng/next-usequerystate/workflows/Continuous%20Integration/badge.svg?branch=next)](https://github.com/47ng/next-usequerystate/actions)
[![Coverage Status](https://coveralls.io/repos/github/47ng/next-usequerystate/badge.svg?branch=next)](https://coveralls.io/github/47ng/next-usequerystate?branch=next)
[![Depfu](https://badges.depfu.com/badges/acad53fa2b09b1e435a19d6d18f29af4/count.svg)](https://depfu.com/github/47ng/next-usequerystate?project_id=22104)

useQueryState hook for Next.js - Like React.useState, but stored in the URL query string

## Features

- 🧘‍♀️ Simple: the URL is the source of truth.
- 🕰 Replace history or append to use the Back button to navigate state updates
- ⚡️ Built-in converters for common object types (number, float, boolean, Date)
- ♊️ Linked querystrings with `useQueryStates`

## Installation

```shell
$ yarn add next-usequerystate
or
$ npm install next-usequerystate
```

## Usage

```tsx
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

We provide helpers for common object types:

```ts
import { queryTypes } from 'next-usequerystate'

useQueryState('tag') // defaults to string
useQueryState('count', queryTypes.integer)
useQueryState('brightness', queryTypes.float)
useQueryState('darkMode', queryTypes.boolean)
useQueryState('after', queryTypes.timestamp) // state is a Date
useQueryState('date', queryTypes.isoDateTime) // state is a Date
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
import { useQueryState, queryTypes } from 'next-usequerystate'

export default () => {
  const [count, setCount] = useQueryState('count', queryTypes.integer)
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
const [count, setCount] = useQueryState(
  'count',
  queryTypes.integer.withDefault(0)
)

const increment = () => setCount(c => c + 1) // c will never be null
const decrement = () => setCount(c => c - 1) // c will never be null
const clearCount = () => setCount(null) // Remove query from the URL
```

Note: the default value is internal to React, it will **not** be written to the
URL.

Setting the state to `null` will remove the key in the query string and set the
state to the default value.

## History options

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

## Multiple Queries

Because the Next.js router has asynchronous methods, if you want to do multiple
query updates in one go, you'll have to `await` them, otherwise the latter will
overwrite the updates of the former:

```ts
const MultipleQueriesDemo = () => {
  const [lat, setLat] = useQueryState('lat', queryTypes.float)
  const [lng, setLng] = useQueryState('lng', queryTypes.float)
  const randomCoordinates = React.useCallback(async () => {
    await setLat(Math.random() * 180 - 90)
    await setLng(Math.random() * 360 - 180)
  }, [])
}
```

For query keys that should always move together, you can use `useQueryStates`
with an object containing each key's type:

```ts
import { useQueryStates, queryTypes } from 'next-usequerystate'

const [coordinates, setCoordinates] = useQueryStates(
  {
    lat: queryTypes.float.withDefault(45.18),
    lng: queryTypes.float.withDefault(5.72)
  },
  {
    history: 'push'
  }
)

const { lat, lng } = coordinates

// Set all (or a subset of) the keys in one go:
await setCoordinates({
  lat: Math.random() * 180 - 90,
  lng: Math.random() * 360 - 180
})
```

## Transition Options

By default Next.js will scroll to the top of the page when changing things in the URL.

To prevent this, `router.push()` and `router.replace()` have a third optional
parameter to control transitions, which can be passed on the state setter here:

```ts
const [name, setName] = useQueryState('name')

setName('Foo', {
  scroll: false,
  shallow: true // Don't run getStaticProps / getServerSideProps / getInitialProps
})
```

## Caveats

Because the Next.js router is not available in an SSR context, this
hook will always return `null` (or the default value if supplied) on SSR/SSG.

## License

[MIT](https://github.com/47ng/next-usequerystate/blob/next/LICENSE)

- Made with ❤️ by [François Best](https://francoisbest.com)

Using this package at work ? [Sponsor me](https://github.com/sponsors/franky47)
to help with support and maintenance.
