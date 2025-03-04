import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { getPackageExportsManifest } from 'vitest-package-exports'

// Update the snapshot when updating the API
// (and adjust the documentation accordingly).
const exports = `
{
  ".": {
    "createLoader": "function",
    "createParser": "function",
    "createSerializer": "function",
    "parseAsArrayOf": "function",
    "parseAsBoolean": "object",
    "parseAsFloat": "object",
    "parseAsHex": "object",
    "parseAsIndex": "object",
    "parseAsInteger": "object",
    "parseAsIsoDate": "object",
    "parseAsIsoDateTime": "object",
    "parseAsJson": "function",
    "parseAsNumberLiteral": "function",
    "parseAsString": "object",
    "parseAsStringEnum": "function",
    "parseAsStringLiteral": "function",
    "parseAsTimestamp": "object",
    "useQueryState": "function",
    "useQueryStates": "function",
  },
  "./adapters/custom": {
    "renderQueryString": "function",
    "unstable_createAdapterProvider": "function",
  },
  "./adapters/next": {
    "NuqsAdapter": "function",
  },
  "./adapters/next/app": {
    "NuqsAdapter": "function",
  },
  "./adapters/next/pages": {
    "NuqsAdapter": "function",
  },
  "./adapters/react": {
    "NuqsAdapter": "function",
    "enableHistorySync": "function",
  },
  "./adapters/react-router": {
    "NuqsAdapter": "function",
    "useOptimisticSearchParams": "function",
  },
  "./adapters/react-router/v6": {
    "NuqsAdapter": "function",
    "useOptimisticSearchParams": "function",
  },
  "./adapters/react-router/v7": {
    "NuqsAdapter": "function",
    "useOptimisticSearchParams": "function",
  },
  "./adapters/remix": {
    "NuqsAdapter": "function",
    "useOptimisticSearchParams": "function",
  },
  "./adapters/testing": {
    "NuqsTestingAdapter": "function",
    "withNuqsTestingAdapter": "function",
  },
  "./server": {
    "createLoader": "function",
    "createParser": "function",
    "createSearchParamsCache": "function",
    "createSerializer": "function",
    "parseAsArrayOf": "function",
    "parseAsBoolean": "object",
    "parseAsFloat": "object",
    "parseAsHex": "object",
    "parseAsIndex": "object",
    "parseAsInteger": "object",
    "parseAsIsoDate": "object",
    "parseAsIsoDateTime": "object",
    "parseAsJson": "function",
    "parseAsNumberLiteral": "function",
    "parseAsString": "object",
    "parseAsStringEnum": "function",
    "parseAsStringLiteral": "function",
    "parseAsTimestamp": "object",
  },
  "./testing": {
    "isParserBijective": "function",
    "testParseThenSerialize": "function",
    "testSerializeThenParse": "function",
  },
}
`

it('has a stable exported API (package.json)', async () => {
  const manifest = await getPackageExportsManifest({
    importMode: 'package',
    cwd: fileURLToPath(import.meta.url)
  })
  expect(manifest.exports).toMatchInlineSnapshot(exports)
})

it('has a stable exported API (dist)', async () => {
  const manifest = await getPackageExportsManifest({
    importMode: 'dist',
    cwd: fileURLToPath(import.meta.url)
  })
  expect(manifest.exports).toMatchInlineSnapshot(exports)
})
