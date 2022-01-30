import type { Router } from 'next/router'

// Next.js does not export the TransitionsOption interface,
// but we can get it from where it's used:
export type TransitionOptions = Parameters<Router['push']>[2]

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
  timestamp: SerializersWithDefaultFactory<Date>
  isoDateTime: SerializersWithDefaultFactory<Date>
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
    parse: v => parseInt(v),
    serialize: v => Math.round(v).toFixed(),
    withDefault(defaultValue) {
      return {
        ...this,
        defaultValue
      }
    }
  },
  float: {
    parse: v => parseFloat(v),
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
  }
}
