import { assertType, describe, expect, it } from 'vitest'
import {
  createParser,
  parseAsBoolean,
  parseAsInteger,
  parseAsString
} from './parsers'
import { createStandardSchemaV1 } from './standard-schema'

describe('standard schema', () => {
  it('allows deriving the types from a schema', () => {
    const schema = {
      foo: parseAsString,
      bar: parseAsInteger.withDefault(0),
      egg: parseAsBoolean.withDefault(false)
    }
    const validator = createStandardSchemaV1(schema)
    assertType<
      | {
          foo: string | null
          bar: number
          egg: boolean
        }
      | undefined
    >(validator['~standard'].types?.output)
  })
  it('validates an object of already the right shape', async () => {
    const schema = {
      foo: parseAsString,
      bar: parseAsInteger.withDefault(0),
      egg: parseAsBoolean.withDefault(false)
    }
    const validator = createStandardSchemaV1(schema)
    const input = {
      foo: 'foo',
      bar: 42,
      egg: true
    }
    const resultMaybePromise = validator['~standard'].validate(input)
    expect(resultMaybePromise).not.toBeInstanceOf(Promise)
    // But we have to await it for TypeScript to understand
    const result = await resultMaybePromise
    expect(result.issues).toBeUndefined()
    if (result.issues === undefined) {
      expect(result.value).toEqual(input)
    }
  })
  it('will validate a missing key without a default', async () => {
    const schema = {
      test: parseAsString
    }
    const validator = createStandardSchemaV1(schema)
    const input = {}
    const result = await validator['~standard'].validate(input)
    expect(result.issues).toBeUndefined()
    if (result.issues === undefined) {
      expect(result.value).toEqual({
        test: null
      })
    }
  })
  it('will validate a missing key with a default', async () => {
    const schema = {
      test: parseAsString.withDefault('default')
    }
    const validator = createStandardSchemaV1(schema)
    const input = {}
    const result = await validator['~standard'].validate(input)
    expect(result.issues).toBeUndefined()
    if (result.issues === undefined) {
      expect(result.value).toEqual({
        test: 'default'
      })
    }
  })
  it('will not validate a parser that returns null', async () => {
    const schema = {
      test: createParser({
        parse: () => null,
        serialize: String
      })
    }
    const validator = createStandardSchemaV1(schema)
    const input = {
      test: 'should-not-parse'
    }
    const result = await validator['~standard'].validate(input)
    expect(result.issues).toBeDefined()
    expect(result.issues).toHaveLength(1)
    expect(result.issues![0]!.message).toEqual(
      '[nuqs] Failed to parse query `should-not-parse` for key `test` (got null)'
    )
  })
  it('will not validate a parser that throws', async () => {
    const schema = {
      test: createParser<string>({
        parse: () => {
          throw new Error('Boom')
        },
        serialize: String
      })
    }
    const validator = createStandardSchemaV1(schema)
    const input = {
      test: 'should-not-parse'
    }
    const result = await validator['~standard'].validate(input)
    expect(result.issues).toBeDefined()
    expect(result.issues).toHaveLength(1)
    expect(result.issues![0]!.message).toEqual(
      '[nuqs] Error while parsing query `should-not-parse` for key `test`: Error: Boom'
    )
  })
  it('allows for partial outputs', async () => {
    const schema = {
      foo: parseAsString,
      bar: parseAsInteger.withDefault(0),
      egg: parseAsBoolean.withDefault(false)
    }
    const validator = createStandardSchemaV1(schema, { partialOutput: true })
    const input = {}
    const resultMaybePromise = validator['~standard'].validate(input)
    expect(resultMaybePromise).not.toBeInstanceOf(Promise)
    // But we have to await it for TypeScript to understand
    const result = await resultMaybePromise
    expect(result.issues).toBeUndefined()
    if (result.issues === undefined) {
      expect(result.value).toEqual({})
    }
  })
})
