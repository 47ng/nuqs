import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Options } from './defs'
import { safeParse } from './lib/safe-parse'

type Require<T, Keys extends keyof T> = Pick<Required<T>, Keys> & Omit<T, Keys>

export type Parser<T> = {
  /**
   * Convert a query string value into a state value.
   *
   * If the string value does not represent a valid state value,
   * the parser should return `null`. Throwing an error is also supported.
   */
  parse: (value: string) => T | null

  /**
   * Render the state value into a query string value.
   */
  serialize?: (value: T) => string

  /**
   * Check if two state values are equal.
   *
   * This is used when using the `clearOnDefault` value, to compare the default
   * value with the set value.
   *
   * It makes sense to provide this function when the state value is an object
   * or an array, as the default referential equality check will not work.
   */
  eq?: (a: T, b: T) => boolean
}

export type ParserBuilder<T> = Required<Parser<T>> &
  Options & {
    /**
     * Set history type, shallow routing and scroll restoration options
     * at the hook declaration level.
     *
     * Note that you can override those options in individual calls to the
     * state updater function.
     */
    withOptions<This>(this: This, options: Options): This

    /**
     * Specifying a default value makes the hook state non-nullable when the
     * query is missing from the URL: the default value is returned instead
     * of `null`.
     *
     * Setting the state to the default value¹ will clear the query string key
     * from the URL, unless `clearOnDefault` is set to `false`.
     *
     * Setting the state to `null` will always clear the query string key
     * from the URL, and return the default value.
     *
     * ¹: Equality is checked with the parser's `eq` function, or referential
     * equality if not provided.
     *
     * @param defaultValue
     */
    withDefault(
      this: ParserBuilder<T>,
      defaultValue: NonNullable<T>
    ): Omit<ParserBuilder<T>, 'parseServerSide'> & {
      readonly defaultValue: NonNullable<T>

      /**
       * Use the parser in Server Components
       *
       * `parse` is intended to be used only by the hook, but you can use this
       * method to hydrate query values on server-side rendered pages.
       * See the `server-side-parsing` demo for an example.
       *
       * Note that when multiple queries are presented to the parser
       * (eg: `/?a=1&a=2`), only the **first** will be parsed, to mimic the
       * behaviour of URLSearchParams:
       * https://url.spec.whatwg.org/#dom-urlsearchparams-get
       *
       * @param value as coming from page props
       *
       * @deprecated prefer using loaders instead, as they enforce a strong
       * bond between the data type and the search param key.
       */
      parseServerSide(value: string | string[] | undefined): NonNullable<T>
    }

    /**
     * Use the parser in Server Components
     *
     * `parse` is intended to be used only by the hook, but you can use this
     * method to hydrate query values on server-side rendered pages.
     * See the `server-side-parsing` demo for an example.
     *
     * Note that when multiple queries are presented to the parser
     * (eg: `/?a=1&a=2`), only the **first** will be parsed, to mimic the
     * behaviour of URLSearchParams:
     * https://url.spec.whatwg.org/#dom-urlsearchparams-get
     *
     * @param value as coming from page props
     *
     * @deprecated prefer using loaders instead, as they enforce a strong
     * bond between the data type and the search param key.
     */
    parseServerSide(value: string | string[] | undefined): T | null
  }

/**
 * Wrap a set of parse/serialize functions into a builder pattern parser
 * you can pass to one of the hooks, making its default value type safe.
 */
export function createParser<T>(
  parser: Require<Parser<T>, 'parse' | 'serialize'>
): ParserBuilder<T> {
  function parseServerSideNullable(value: string | string[] | undefined) {
    if (typeof value === 'undefined') {
      return null
    }
    let str = ''
    if (Array.isArray(value)) {
      // Follow the spec:
      // https://url.spec.whatwg.org/#dom-urlsearchparams-get
      if (value[0] === undefined) {
        return null
      }
      str = value[0]
    }
    if (typeof value === 'string') {
      str = value
    }
    return safeParse(parser.parse, str)
  }

  return {
    eq: (a, b) => a === b,
    ...parser,
    parseServerSide: parseServerSideNullable,
    withDefault(defaultValue) {
      return {
        ...this,
        defaultValue,
        parseServerSide(value) {
          return parseServerSideNullable(value) ?? defaultValue
        }
      }
    },
    withOptions(options: Options) {
      return {
        ...this,
        ...options
      }
    }
  }
}

// Parsers implementations -----------------------------------------------------

export const parseAsString: ParserBuilder<string> = createParser({
  parse: v => v,
  serialize: String
})

export const parseAsInteger: ParserBuilder<number> = createParser({
  parse: v => {
    const int = parseInt(v)
    return int == int ? int : null // NaN check at low bundle size cost
  },
  serialize: v => '' + Math.round(v)
})

export const parseAsIndex: ParserBuilder<number> = createParser({
  parse: v => {
    const int = parseInt(v)
    return int == int ? int - 1 : null // NaN check at low bundle size cost
  },
  serialize: v => '' + Math.round(v + 1)
})

export const parseAsHex: ParserBuilder<number> = createParser({
  parse: v => {
    const int = parseInt(v, 16)
    return int == int ? int : null // NaN check at low bundle size cost
  },
  serialize: v => {
    const hex = Math.round(v).toString(16)
    return (hex.length & 1 ? '0' : '') + hex
  }
})

export const parseAsFloat: ParserBuilder<number> = createParser({
  parse: v => {
    const float = parseFloat(v)
    return float == float ? float : null // NaN check at low bundle size cost
  },
  serialize: String
})

export const parseAsBoolean: ParserBuilder<boolean> = createParser({
  parse: v => v === 'true',
  serialize: String
})

function compareDates(a: Date, b: Date) {
  return a.valueOf() === b.valueOf()
}

/**
 * Querystring encoded as the number of milliseconds since epoch,
 * and returned as a Date object.
 */
export const parseAsTimestamp: ParserBuilder<Date> = createParser({
  parse: v => {
    const ms = parseInt(v)
    return ms == ms ? new Date(ms) : null // NaN check at low bundle size cost
  },
  serialize: (v: Date) => '' + v.valueOf(),
  eq: compareDates
})

/**
 * Querystring encoded as an ISO-8601 string (UTC),
 * and returned as a Date object.
 */
export const parseAsIsoDateTime: ParserBuilder<Date> = createParser({
  parse: v => {
    const date = new Date(v)
    // NaN check at low bundle size cost
    return date.valueOf() == date.valueOf() ? date : null
  },
  serialize: (v: Date) => v.toISOString(),
  eq: compareDates
})

/**
 * Querystring encoded as an ISO-8601 string (UTC)
 * without the time zone offset, and returned as
 * a Date object.
 *
 * The Date is parsed without the time zone offset,
 * making it at 00:00:00 UTC.
 */
export const parseAsIsoDate: ParserBuilder<Date> = createParser({
  parse: v => {
    const date = new Date(v.slice(0, 10))
    // NaN check at low bundle size cost
    return date.valueOf() == date.valueOf() ? date : null
  },
  serialize: (v: Date) => v.toISOString().slice(0, 10),
  eq: compareDates
})

/**
 * Parse and validate UUID strings from the query string.
 *
 * By default, accepts any valid UUID format (v1-v8) including the special
 * nil UUID (all zeros) and max UUID (all Fs). You can optionally specify
 * a specific UUID version to validate against.
 *
 * @param opts - Optional configuration object
 * @param opts.version - Specific UUID version to validate (1-8)
 * @returns A parser that validates UUID strings
 *
 * @example
 * ```ts
 * // Accept any valid UUID
 * const [id, setId] = useQueryState('id', parseAsUuid())
 *
 * // URL: ?id=550e8400-e29b-41d4-a716-446655440000
 * console.log(id) // "550e8400-e29b-41d4-a716-446655440000"
 * ```
 *
 * @example
 * ```ts
 * // Only accept UUID v4
 * const [sessionId, setSessionId] = useQueryState(
 *   'sessionId',
 *   parseAsUuid({ version: 4 }).withDefault('00000000-0000-0000-0000-000000000000')
 * )
 *
 * // URL: ?sessionId=f47ac10b-58cc-4372-a567-0e02b2c3d479
 * console.log(sessionId) // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 * ```
 */
export function parseAsUuid(opts?: {
  version?: number
}): ParserBuilder<string> {
  return createParser({
    parse: v => {
      let uuidRegex =
        /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/
      if (opts?.version) {
        uuidRegex = new RegExp(
          `^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${opts.version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`
        )
      }
      return uuidRegex.test(v) ? v : null
    },
    serialize: String
  })
}

/**
 * String-based enums provide better type-safety for known sets of values.
 * You will need to pass the parseAsStringEnum function a list of your enum values
 * in order to validate the query string. Anything else will return `null`,
 * or your default value if specified.
 *
 * Example:
 * ```ts
 * enum Direction {
 *   up = 'UP',
 *   down = 'DOWN',
 *   left = 'LEFT',
 *   right = 'RIGHT'
 * }
 *
 * const [direction, setDirection] = useQueryState(
 *   'direction',
 *    parseAsStringEnum<Direction>(Object.values(Direction)) // pass a list of allowed values
 *      .withDefault(Direction.up)
 * )
 * ```
 *
 * Note: the query string value will be the value of the enum, not its name
 * (example above: `direction=UP`).
 *
 * @param validValues The values you want to accept
 */
export function parseAsStringEnum<Enum extends string>(
  validValues: Enum[]
): ParserBuilder<Enum> {
  // Delegate implementation to parseAsStringLiteral to avoid duplication.
  return parseAsStringLiteral(validValues as readonly Enum[])
}

/**
 * String-based literals provide better type-safety for known sets of values.
 * You will need to pass the parseAsStringLiteral function a list of your string values
 * in order to validate the query string. Anything else will return `null`,
 * or your default value if specified.
 *
 * Example:
 * ```ts
 * const colors = ["red", "green", "blue"] as const
 *
 * const [color, setColor] = useQueryState(
 *   'color',
 *    parseAsStringLiteral(colors) // pass a readonly list of allowed values
 *      .withDefault("red")
 * )
 * ```
 *
 * @param validValues The values you want to accept
 */
export function parseAsStringLiteral<const Literal extends string>(
  validValues: readonly Literal[]
): ParserBuilder<Literal> {
  return createParser({
    parse: (query: string) => {
      const asConst = query as unknown as Literal
      return validValues.includes(asConst) ? asConst : null
    },
    serialize: String
  })
}

/**
 * Number-based literals provide better type-safety for known sets of values.
 * You will need to pass the parseAsNumberLiteral function a list of your number values
 * in order to validate the query string. Anything else will return `null`,
 * or your default value if specified.
 *
 * Example:
 * ```ts
 * const diceSides = [1, 2, 3, 4, 5, 6] as const
 *
 * const [side, setSide] = useQueryState(
 *   'side',
 *    parseAsNumberLiteral(diceSides) // pass a readonly list of allowed values
 *      .withDefault(4)
 * )
 * ```
 *
 * @param validValues The values you want to accept
 */
export function parseAsNumberLiteral<const Literal extends number>(
  validValues: readonly Literal[]
): ParserBuilder<Literal> {
  return createParser({
    parse: (query: string) => {
      const asConst = parseFloat(query) as unknown as Literal
      if (validValues.includes(asConst)) {
        return asConst
      }
      return null
    },
    serialize: String
  })
}

/**
 * Encode any object shape into the querystring value as JSON.
 * Note: you may want to use `useQueryStates` for finer control over
 * multiple related query keys.
 *
 * @param runtimeParser Runtime parser (eg: Zod schema or Standard Schema) to validate after JSON.parse
 */
export function parseAsJson<T>(
  validator: ((value: unknown) => T | null) | StandardSchemaV1<T>
): ParserBuilder<T> {
  return createParser({
    parse: query => {
      try {
        const obj = JSON.parse(query)
        if ('~standard' in validator) {
          const result = validator['~standard'].validate(obj)
          if (result instanceof Promise) {
            throw new Error(
              '[nuqs] Only synchronous Standard Schemas are supported in parseAsJson.'
            )
          }
          return result.issues ? null : result.value
        }
        return validator(obj)
      } catch {
        return null
      }
    },
    serialize: value => JSON.stringify(value),
    eq(a, b) {
      // Check for referential equality first
      return a === b || JSON.stringify(a) === JSON.stringify(b)
    }
  })
}

/**
 * A comma-separated list of items.
 * Items are URI-encoded for safety, so they may not look nice in the URL.
 *
 * @param itemParser Parser for each individual item in the array
 * @param separator The character to use to separate items (default ',')
 */
export function parseAsArrayOf<ItemType>(
  itemParser: Parser<ItemType>,
  separator = ','
): ParserBuilder<ItemType[]> {
  const itemEq = itemParser.eq ?? ((a: ItemType, b: ItemType) => a === b)
  const encodedSeparator = encodeURIComponent(separator)
  // todo: Handle default item values and make return type non-nullable
  return createParser({
    parse: query => {
      if (query === '') {
        // Empty query should not go through the split/map/filter logic,
        // see https://github.com/47ng/nuqs/issues/329
        return [] as ItemType[]
      }
      return query
        .split(separator)
        .map((item, index) =>
          safeParse(
            itemParser.parse,
            item.replaceAll(encodedSeparator, separator),
            `[${index}]`
          )
        )
        .filter(value => value !== null && value !== undefined) as ItemType[]
    },
    serialize: values =>
      values
        .map<string>(value => {
          const str = itemParser.serialize
            ? itemParser.serialize(value)
            : String(value)
          return str.replaceAll(separator, encodedSeparator)
        })
        .join(separator),
    eq(a, b) {
      if (a === b) {
        return true // Referentially stable
      }
      if (a.length !== b.length) {
        return false
      }
      return a.every((value, index) => itemEq(value, b[index]!))
    }
  })
}

type inferSingleParserType<Parser> = Parser extends ParserBuilder<
  infer Value
> & {
  defaultValue: infer Value
}
  ? Value
  : Parser extends ParserBuilder<infer Value>
    ? Value | null
    : never

type inferParserRecordType<Map extends Record<string, ParserBuilder<any>>> = {
  [Key in keyof Map]: inferSingleParserType<Map[Key]>
} & {}

/**
 * Type helper to extract the underlying returned data type of a parser
 * or of an object describing multiple parsers and their associated keys.
 *
 * Usage:
 *
 * ```ts
 * import { type inferParserType } from 'nuqs' // or 'nuqs/server'
 *
 * const intNullable = parseAsInteger
 * const intNonNull = parseAsInteger.withDefault(0)
 *
 * inferParserType<typeof intNullable> // number | null
 * inferParserType<typeof intNonNull> // number
 *
 * const parsers = {
 *  a: parseAsInteger,
 *  b: parseAsBoolean.withDefault(false)
 * }
 *
 * inferParserType<typeof parsers>
 * // { a: number | null, b: boolean }
 * ```
 */
export type inferParserType<Input> =
  Input extends ParserBuilder<any>
    ? inferSingleParserType<Input>
    : Input extends Record<string, ParserBuilder<any>>
      ? inferParserRecordType<Input>
      : never

export type ParserWithOptionalDefault<T> = ParserBuilder<T> & {
  defaultValue?: T
}
export type ParserMap = Record<string, ParserWithOptionalDefault<any>>
