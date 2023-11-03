import { expectType } from 'tsd'
import { parseAsString } from '../../dist'

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
