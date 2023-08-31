export type HistoryOptions = 'replace' | 'push'

export type Nullable<T> = {
  [K in keyof T]: T[K] | null
}

export type Serializers<T> = {
  parse: (value: string) => T | null
  serialize?: (value: T) => string
}

export type SerializersWithDefaultFactory<T> = Serializers<T> & {
  withDefault: (defaultValue: T) => Serializers<T> & {
    readonly defaultValue: T
  }
}

export type QueryTypeMap = Readonly<{
  string: SerializersWithDefaultFactory<string>
  integer: SerializersWithDefaultFactory<number>
  float: SerializersWithDefaultFactory<number>
  boolean: SerializersWithDefaultFactory<boolean>

  /**
   * Querystring encoded as the number of milliseconds since epoch,
   * and returned as a Date object.
   */
  timestamp: SerializersWithDefaultFactory<Date>

  /**
   * Querystring encoded as an ISO-8601 string (UTC),
   * and returned as a Date object.
   */
  isoDateTime: SerializersWithDefaultFactory<Date>

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
  stringEnum<Enum extends string>(
    validValues: Enum[]
  ): SerializersWithDefaultFactory<Enum>

  /**
   * Encode any object shape into the querystring value as JSON.
   * Value is URI-encoded for safety, so it may not look nice in the URL.
   * Note: you may want to use `useQueryStates` for finer control over
   * multiple related query keys.
   */
  json<T>(): SerializersWithDefaultFactory<T>

  /**
   * A comma-separated list of items.
   * Items are URI-encoded for safety, so they may not look nice in the URL.
   *
   * @param itemSerializers Serializers for each individual item in the array
   * @param separator The character to use to separate items (default ',')
   */
  array<ItemType>(
    itemSerializers: Serializers<ItemType>,
    separator?: string
  ): SerializersWithDefaultFactory<ItemType[]>
}>

export const queryTypes: QueryTypeMap = {
  string: {
    parse: v => v,
    serialize: v => `${v}`,
    withDefault(defaultValue) {
      return {
        ...this,
        defaultValue
      }
    }
  },
  integer: {
    parse: v => {
      const int = parseInt(v)
      if (Number.isNaN(int)) {
        return null
      }
      return int
    },
    serialize: v => Math.round(v).toFixed(),
    withDefault(defaultValue) {
      return {
        ...this,
        defaultValue
      }
    }
  },
  float: {
    parse: v => {
      const float = parseFloat(v)
      if (Number.isNaN(float)) {
        return null
      }
      return float
    },
    serialize: v => v.toString(),
    withDefault(defaultValue) {
      return {
        ...this,
        defaultValue
      }
    }
  },
  boolean: {
    parse: v => v === 'true',
    serialize: v => (Boolean(v) ? 'true' : 'false'),
    withDefault(defaultValue) {
      return {
        ...this,
        defaultValue
      }
    }
  },
  timestamp: {
    parse: v => new Date(parseInt(v)),
    serialize: (v: Date) => v.valueOf().toString(),
    withDefault(defaultValue) {
      return {
        ...this,
        defaultValue
      }
    }
  },
  isoDateTime: {
    parse: v => new Date(v),
    serialize: (v: Date) => v.toISOString(),
    withDefault(defaultValue) {
      return {
        ...this,
        defaultValue
      }
    }
  },
  stringEnum<Enum extends string>(validValues: Enum[]) {
    return {
      parse: (query: string) => {
        const asEnum = query as unknown as Enum
        if (validValues.includes(asEnum)) {
          return asEnum
        }
        return null
      },
      serialize: (value: Enum) => value.toString(),
      withDefault(defaultValue) {
        return {
          ...this,
          defaultValue
        }
      }
    }
  },
  json<T>() {
    return {
      parse: query => {
        try {
          return JSON.parse(decodeURIComponent(query)) as T
        } catch {
          return null
        }
      },
      serialize: value => encodeURIComponent(JSON.stringify(value)),
      withDefault(defaultValue) {
        return {
          ...this,
          defaultValue
        }
      }
    }
  },
  array(itemSerializers, separator = ',') {
    return {
      parse: query => {
        type ItemType = NonNullable<ReturnType<typeof itemSerializers.parse>>
        if (query === '') {
          // Empty query should not go through the split/map/filter logic,
          // see https://github.com/47ng/next-usequerystate/issues/329
          return [] as ItemType[]
        }
        return query
          .split(separator)
          .map(item => decodeURIComponent(item))
          .map(itemSerializers.parse)
          .filter(value => value !== null && value !== undefined) as ItemType[]
      },
      serialize: values =>
        values
          .map<string>(value => {
            if (itemSerializers.serialize) {
              return itemSerializers.serialize(value)
            }
            return `${value}`
          })
          .map(encodeURIComponent)
          .join(separator),
      withDefault(defaultValue) {
        return {
          ...this,
          defaultValue
        }
      }
    }
  }
}
