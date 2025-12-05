import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { Options } from './defs'
import { safeParse } from './lib/safe-parse'

type Require<T, Keys extends keyof T> = Pick<Required<T>, Keys> & Omit<T, Keys>

export type SingleParser<T> = {
  type?: 'single'
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
   * This is used when using the `writeDefaults` value, to compare the default
   * value with the set value.
   *
   * It makes sense to provide this function when the state value is an object
   * or an array, as the default referential equality check will not work.
   */
  eq?: (a: T, b: T) => boolean
}

export type MultiParser<T> = {
  type: 'multi'
  parse: (value: ReadonlyArray<string>) => T | null
  serialize?: (value: T) => Array<string>
  eq?: (a: T, b: T) => boolean
}

export type GenericParser<T> = SingleParser<T> | MultiParser<T>
export type GenericParserBuilder<T> =
  | SingleParserBuilder<T>
  | MultiParserBuilder<T>

/* type aliases for backwards compatibility */
/** @deprecated use SingleParser instead */
export type Parser<T> = SingleParser<T>
/** @deprecated use SingleParserBuilder instead */
export type ParserBuilder<T> = SingleParserBuilder<T>

export type SingleParserBuilder<T> = Required<SingleParser<T>> &
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
     * from the URL, unless `writeDefaults` is set to `true`.
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
      this: SingleParserBuilder<T>,
      defaultValue: NonNullable<T>
    ): Omit<SingleParserBuilder<T>, 'parseServerSide'> & {
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

export type MultiParserBuilder<T> = Required<MultiParser<T>> &
  Options & {
    withOptions<This>(this: This, options: Options): This
    withDefault(
      this: MultiParserBuilder<T>,
      defaultValue: NonNullable<T>
    ): Omit<MultiParserBuilder<T>, 'parseServerSide'> & {
      readonly defaultValue: NonNullable<T>
      /**
       * @deprecated exposed for symmetry with SingleParserBuilder only,
       * prefer using loaders instead.
       */
      parseServerSide(value: string | string[] | undefined): NonNullable<T>
    }
    /**
     * @deprecated exposed for symmetry with SingleParserBuilder only,
     * prefer using loaders instead.
     */
    parseServerSide(value: string | string[] | undefined): T | null
  }

/**
 * Wrap a set of parse/serialize functions into a builder pattern parser
 * you can pass to one of the hooks, making its default value type safe.
 */
export function createParser<T>(
  parser: Require<SingleParser<T>, 'parse' | 'serialize'>
): SingleParserBuilder<T> {
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
    type: 'single',
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

export function createMultiParser<T>(
  parser: Omit<Require<MultiParser<T>, 'parse' | 'serialize'>, 'type'>
): MultiParserBuilder<T> {
  function parseServerSideNullable(value: string | string[] | undefined) {
    if (typeof value === 'undefined') {
      return null
    }
    return safeParse(parser.parse, Array.isArray(value) ? value : [value])
  }

  return {
    type: 'multi',
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

export const parseAsString: SingleParserBuilder<string> = createParser({
  parse: v => v,
  serialize: String
})

export const parseAsInteger: SingleParserBuilder<number> = createParser({
  parse: v => {
    const int = parseInt(v)
    return int == int ? int : null // NaN check at low bundle size cost
  },
  serialize: v => '' + Math.round(v)
})

export const parseAsIndex: SingleParserBuilder<number> = createParser({
  parse: v => {
    const int = parseInt(v)
    return int == int ? int - 1 : null // NaN check at low bundle size cost
  },
  serialize: v => '' + Math.round(v + 1)
})

export const parseAsHex: SingleParserBuilder<number> = createParser({
  parse: v => {
    const int = parseInt(v, 16)
    return int == int ? int : null // NaN check at low bundle size cost
  },
  serialize: v => {
    const hex = Math.round(v).toString(16)
    return (hex.length & 1 ? '0' : '') + hex
  }
})

export const parseAsFloat: SingleParserBuilder<number> = createParser({
  parse: v => {
    const float = parseFloat(v)
    return float == float ? float : null // NaN check at low bundle size cost
  },
  serialize: String
})

export const parseAsBoolean: SingleParserBuilder<boolean> = createParser({
  parse: v => v.toLowerCase() === 'true',
  serialize: String
})

function compareDates(a: Date, b: Date) {
  return a.valueOf() === b.valueOf()
}

/**
 * Querystring encoded as the number of milliseconds since epoch,
 * and returned as a Date object.
 */
export const parseAsTimestamp: SingleParserBuilder<Date> = createParser({
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
export const parseAsIsoDateTime: SingleParserBuilder<Date> = createParser({
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
export const parseAsIsoDate: SingleParserBuilder<Date> = createParser({
  parse: v => {
    const date = new Date(v.slice(0, 10))
    // NaN check at low bundle size cost
    return date.valueOf() == date.valueOf() ? date : null
  },
  serialize: (v: Date) => v.toISOString().slice(0, 10),
  eq: compareDates
})

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
): SingleParserBuilder<Enum> {
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
): SingleParserBuilder<Literal> {
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
): SingleParserBuilder<Literal> {
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
): SingleParserBuilder<T> {
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
  itemParser: SingleParser<ItemType>,
  separator = ','
): SingleParserBuilder<ItemType[]> {
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

export function parseAsNativeArrayOf<ItemType>(
  itemParser: SingleParser<ItemType>
): ReturnType<MultiParserBuilder<ItemType[]>['withDefault']> {
  const itemEq = itemParser.eq ?? ((a: ItemType, b: ItemType) => a === b)
  return createMultiParser({
    parse: query => {
      const parsed = query
        .map((item, index) => safeParse(itemParser.parse, item, `[${index}]`))
        .filter(value => value !== null && value !== undefined) as ItemType[]
      return parsed.length === 0 ? null : parsed
    },
    serialize: values => {
      // defensive check because we potentially get a single value passed from a standard schema
      const safeValues = Array.isArray(values) ? values : [values]
      return safeValues.flatMap(value => {
        const serialized = itemParser.serialize?.(value) ?? String(value)
        return typeof serialized === 'string' ? [serialized] : [...serialized]
      })
    },
    eq(a, b) {
      if (a === b) {
        return true // Referentially stable
      }
      if (a.length !== b.length) {
        return false
      }
      return a.every((value, index) => itemEq(value, b[index]!))
    }
  }).withDefault([])
}

type inferSingleParserType<Parser> = Parser extends GenericParserBuilder<
  infer Value
> & {
  defaultValue: infer Value
}
  ? Value
  : Parser extends GenericParserBuilder<infer Value>
    ? Value | null
    : never

type inferParserRecordType<
  Map extends Record<string, GenericParserBuilder<any>>
> = {
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
  Input extends GenericParserBuilder<any>
    ? inferSingleParserType<Input>
    : Input extends Record<string, GenericParserBuilder<any>>
      ? inferParserRecordType<Input>
      : never

export type ParserWithOptionalDefault<T> = GenericParserBuilder<T> & {
  defaultValue?: T
}
export type ParserMap = Record<string, ParserWithOptionalDefault<any>>
