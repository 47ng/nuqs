import { assert, type Equals } from 'tsafe'
import { expectType } from 'tsd'
import { parseAsInteger, parseAsString, type inferParserType } from '../../dist'

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
    inferParserType<typeof parsers>,
    { str: string | null; int: number | null }
  >
>()
