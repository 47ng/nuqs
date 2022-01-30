import { expectError, expectNotAssignable, expectType } from 'tsd'
import { queryTypes, useQueryStates } from '../index'

{
  const [states, setStates] = useQueryStates(
    {
      a: queryTypes.string,
      b: queryTypes.integer,
      c: queryTypes.float,
      d: queryTypes.boolean
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
  const out = await setStates({ b: 42 })
  expectType<boolean>(out)
}

// With default values, state is no longer nullable
{
  const [states, setStates] = useQueryStates({
    hasDefault: queryTypes.string.withDefault('foo'),
    doesNot: queryTypes.isoDateTime
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
