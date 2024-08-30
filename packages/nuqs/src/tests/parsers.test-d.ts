import React from 'react'
import { assert, type Equals } from 'tsafe'
import { expectError, expectType } from 'tsd'
import {
  parseAsInteger,
  parseAsString,
  type inferParserRecordType,
  type inferParserType
} from '../../dist'

{
  const p = parseAsString
  expectType<string | null>(p.parse('foo'))
  expectType<string>(p.serialize('foo'))
  expectType<string | null>(p.parseServerSide(undefined))
}

{
  const p = parseAsString.withOptions({}).withOptions({ scroll: true })
  expectType<string | null>(p.parse('foo'))
  expectType<string>(p.serialize('foo'))
  expectType<string | null>(p.parseServerSide(undefined))
}

{
  const p = parseAsString.withDefault('default')
  expectType<string | null>(p.parse('foo')) // That one allows null
  expectType<string>(p.parseServerSide(undefined)) // That one doesn't
}

{
  // Adding options to a parser with a default value doesn't lose type safety
  const p = parseAsString.withDefault('default').withOptions({ scroll: true })
  expectType<string | null>(p.parse('foo'))
  expectType<string>(p.parseServerSide(undefined))
}

// Shallow / startTransition interaction
{
  type RSTF = React.TransitionStartFunction
  type MaybeBool = boolean | undefined
  type MaybeRSTF = RSTF | undefined

  expectType<MaybeBool>(parseAsString.withOptions({}).shallow)
  expectType<MaybeRSTF>(parseAsString.withOptions({}).startTransition)
  expectType<MaybeBool>(parseAsString.withOptions({ shallow: true }).shallow)
  expectType<MaybeRSTF>(
    parseAsString.withOptions({ shallow: true }).startTransition
  )
  expectType<MaybeBool>(parseAsString.withOptions({ shallow: false }).shallow)
  expectType<MaybeRSTF>(
    parseAsString.withOptions({ shallow: false }).startTransition
  )
  expectType<MaybeBool>(
    parseAsString.withOptions({ startTransition: () => {} }).shallow
  )
  expectType<MaybeRSTF>(
    parseAsString.withOptions({ startTransition: () => {} }).startTransition
  )
  // Allowed
  parseAsString.withOptions({
    shallow: false,
    startTransition: () => {}
  })
  // Not allowed
  expectError(() => {
    parseAsString.withOptions({
      shallow: true,
      startTransition: () => {}
    })
  })
  expectError(() => {
    parseAsString.withOptions({
      shallow: {}
    })
  })

  expectError(() => {
    parseAsString.withOptions({
      startTransition: {}
    })
  })
}

// Type inference
assert<Equals<inferParserType<typeof parseAsString>, string | null>>()
const withDefault = parseAsString.withDefault('')
assert<Equals<inferParserType<typeof withDefault>, string>>()
const parsers = {
  str: parseAsString,
  int: parseAsInteger
}
assert<
  Equals<
    inferParserRecordType<typeof parsers>,
    { str: string | null; int: number | null }
  >
>()
