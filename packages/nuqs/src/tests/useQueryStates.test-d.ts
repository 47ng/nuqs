import { expectError, expectNotAssignable, expectType } from 'tsd'
import {
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsString,
  useQueryStates
} from '../../dist'

{
  const [states, setStates] = useQueryStates(
    {
      a: parseAsString,
      b: parseAsInteger,
      c: parseAsFloat,
      d: parseAsBoolean
    },
    {
      history: 'push'
    }
  )
  expectType<{
    a: string | null
    b: number | null
    c: number | null
    d: boolean | null
  }>(states)
  setStates({
    a: 'foo',
    c: 3.14
  })
  setStates(old => ({
    ...old,
    d: !old.d
  }))
}

// With default values, state is no longer nullable
{
  const [states, setStates] = useQueryStates({
    hasDefault: parseAsString.withDefault('foo'),
    doesNot: parseAsIsoDateTime
  })
  expectType<{
    hasDefault: string
    doesNot: Date | null
  }>(states)
  expectNotAssignable<null>(states.hasDefault)
  states.doesNot = null
  // `null` should always be accepted as setStates
  setStates({
    hasDefault: null,
    doesNot: null
  })
  setStates(() => ({
    hasDefault: null,
    doesNot: null
  }))
  // but not at root level
  expectError(() => {
    setStates(null)
  })
}

// Custom parsers
{
  const [states] = useQueryStates({
    hex: {
      parse: input => parseInt(input, 16),
      serialize: (value: number) => value.toString(16)
    },
    bin: {
      parse: input => Buffer.from(input),
      defaultValue: Buffer.from('')
    }
  })
  expectType<{
    hex: number | null
    bin: Buffer
  }>(states)
}
