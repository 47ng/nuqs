export type HistoryOptions = 'replace' | 'push'

export type Serializers<T> = {
  parse: (value: string) => T | null
  serialize: (value: T) => string
}

export type QueryTypeMap = {
  string: Serializers<string>
  integer: Serializers<number>
  float: Serializers<number>
  timestamp: Serializers<Date>
  isoDateTime: Serializers<Date>
}

export const queryTypes: QueryTypeMap = {
  string: {
    parse: v => v,
    serialize: v => `${v}`
  },
  integer: {
    parse: v => parseInt(v),
    serialize: v => Math.round(v).toFixed()
  },
  float: {
    parse: v => parseFloat(v),
    serialize: v => v.toString()
  },
  timestamp: {
    parse: v => new Date(v),
    serialize: (v: Date) => v.valueOf().toString()
  },
  isoDateTime: {
    parse: v => new Date(v),
    serialize: (v: Date) => v.toISOString()
  }
}
