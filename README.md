# useQueryState for Next.js

[![NPM](https://img.shields.io/npm/v/next-usequerystate?color=red)](https://www.npmjs.com/package/next-usequerystate)
[![MIT License](https://img.shields.io/github/license/47ng/next-usequerystate.svg?color=blue)](https://github.com/47ng/next-usequerystate/blob/next/LICENSE)
[![Continuous Integration](https://github.com/47ng/next-usequerystate/workflows/Continuous%20Integration/badge.svg?branch=next)](https://github.com/47ng/next-usequerystate/actions)
[![Coverage Status](https://coveralls.io/repos/github/47ng/next-usequerystate/badge.svg?branch=next)](https://coveralls.io/github/47ng/next-usequerystate?branch=next)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=47ng/next-usequerystate)](https://dependabot.com)

useQueryState hook for Next.js - Like React.useState, but stored in the URL query string

## Features

- 🧘‍♀️ Simple: the URL is the source of truth.
- 🕰 Replace history or append to use the Back button to navigate state updates

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

You may pass a `serialize` function for the opposite direction, by default
`toString()` is used.

Example: simple counter stored in the URL:

```tsx
import { useQueryState } from 'next-usequerystate'

export default () => {
  const [count, setCount] = useQueryState('count', {
    // TypeScript will automatically infer it's a number
    // based on what `parse` returns.
    parse: parseInt
  })
  return (
    <>
      <pre>count: {count}</pre>
      <button onClick={() => setCount(0)}>Reset</button>
      <button onClick={() => setCount(c => c || 0 + 1)}>+</button>
      <button onClick={() => setCount(c => c || 0 - 1)}>-</button>
      <button onClick={() => setCount(null)}>Clear</button>
    </>
  )
}
```

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

## Caveats

Because the Next.js router is not available in an SSR context, this
hook will always return `null` on SSR/SSG.

## License

[MIT](https://github.com/47ng/next-usequerystate/blob/next/LICENSE) - Made with ❤️ by [François Best](https://francoisbest.com)

Using this package at work ? [Sponsor me](https://github.com/sponsors/franky47) to help with support and maintenance.
