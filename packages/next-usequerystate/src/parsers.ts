import type { Options } from './defs'
import { safeParse } from './utils'

export type Parser<T> = {
  parse: (value: string) => T | null
  serialize?: (value: T) => string
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
    withOptions<This, ShallowState>(
      this: This,
      options: Options<ShallowState>
    ): This

    /**
     * Specifying a default value makes the hook state non-nullable when the
     * query is missing from the URL.
     *
     * Note: if you wish to specify options as well, you need to call
     * `withOptions` **before** `withDefault`.
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
     */
    parseServerSide(value: string | string[] | undefined): T | null
  }

/**
 * Wrap a set of parse/serialize functions into a builder pattern parser
 * you can pass to one of the hooks, making its default value type safe.
 */
export function createParser<T>(parser: Required<Parser<T>>): ParserBuilder<T> {
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

export const parseAsString = createParser({
  parse: v => v,
  serialize: v => `${v}`
})

export const parseAsInteger = createParser({
  parse: v => {
    const int = parseInt(v)
    if (Number.isNaN(int)) {
      return null
    }
    return int
  },
  serialize: v => Math.round(v).toFixed()
})

export const parseAsHex = createParser({
  parse: v => {
    const int = parseInt(v, 16)
    if (Number.isNaN(int)) {
      return null
    }
    return int
  },
  serialize: v => {
    const hex = Math.round(v).toString(16)
    return hex.padStart(hex.length + (hex.length % 2), '0')
  }
})

export const parseAsFloat = createParser({
  parse: v => {
    const float = parseFloat(v)
    if (Number.isNaN(float)) {
      return null
    }
    return float
  },
  serialize: v => v.toString()
})

export const parseAsBoolean = createParser({
  parse: v => v === 'true',
  serialize: v => (Boolean(v) ? 'true' : 'false')
})

/**
 * Querystring encoded as the number of milliseconds since epoch,
 * and returned as a Date object.
 */
export const parseAsTimestamp = createParser({
  parse: v => {
    const ms = parseInt(v)
    if (Number.isNaN(ms)) {
      return null
    }
    return new Date(ms)
  },
  serialize: (v: Date) => v.valueOf().toString()
})

/**
 * Querystring encoded as an ISO-8601 string (UTC),
 * and returned as a Date object.
 */
export const parseAsIsoDateTime = createParser({
  parse: v => {
    const date = new Date(v)
    if (Number.isNaN(date.valueOf())) {
      return null
    }
    return date
  },
  serialize: (v: Date) => v.toISOString()
})

/**
 * String-based enums provide better type-safety for known sets of values.
 * You will need to pass the stringEnum function a list of your enum values
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
 *   queryTypes
 *     .stringEnum<Direction>(Object.values(Direction))
 *     .withDefault(Direction.up)
 * )
 * ```
 *
 * Note: the query string value will be the value of the enum, not its name
 * (example above: `direction=UP`).
 *
 * @param validValues The values you want to accept
 */
export function parseAsStringEnum<Enum extends string>(validValues: Enum[]) {
  return createParser({
    parse: (query: string) => {
      const asEnum = query as unknown as Enum
      if (validValues.includes(asEnum)) {
        return asEnum
      }
      return null
    },
    serialize: (value: Enum) => value.toString()
  })
}

/**
 * Encode any object shape into the querystring value as JSON.
 * Value is URI-encoded for safety, so it may not look nice in the URL.
 * Note: you may want to use `useQueryStates` for finer control over
 * multiple related query keys.
 *
 * @param parser optional parser (eg: Zod schema) to validate after JSON.parse
 */
export function parseAsJson<T>(parser?: (value: unknown) => T) {
  return createParser({
    parse: query => {
      try {
        const obj = JSON.parse(query)
        if (typeof parser === 'function') {
          return parser(obj)
        } else {
          return obj as T
        }
      } catch {
        return null
      }
    },
    serialize: value => JSON.stringify(value)
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
) {
  const encodedSeparator = encodeURIComponent(separator)
  // todo: Handle default item values and make return type non-nullable
  return createParser({
    parse: query => {
      if (query === '') {
        // Empty query should not go through the split/map/filter logic,
        // see https://github.com/47ng/next-usequerystate/issues/329
        return [] as ItemType[]
      }
      return query
        .split(separator)
        .map(item =>
          safeParse(
            itemParser.parse,
            item.replaceAll(encodedSeparator, separator)
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
        .join(separator)
  })
}
