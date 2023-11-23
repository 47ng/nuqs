import { expectError, expectType } from 'tsd'
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

// Shallow / startTransition interaction
{
  expectType<boolean | undefined>(parseAsString.withOptions({}).shallow)
  expectType<boolean | undefined>(
    parseAsString.withOptions({ shallow: true }).shallow
  )
  expectType<boolean | undefined>(
    parseAsString.withOptions({ shallow: false }).shallow
  )
  // Should probably be `false` here, but it's not worth the complexity
  expectType<boolean | undefined>(
    parseAsString.withOptions({ startTransition: () => {} }).shallow
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
}

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
