import type { Parser, ParserBuilder } from './parsers'
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsJson,
  parseAsString,
  parseAsStringEnum,
  parseAsTimestamp
} from './parsers'

/**
 * @deprecated renamed to Parser
 */
export type Serializers<T> = Parser<T>

/**
 * @deprecated renamed to ParserBuilder.
 * You should probably use `createParser` instead.
 */
export type SerializersWithDefaultFactory<T> = ParserBuilder<T>

/**
 * @deprecated use individual `parseAsXyz` imports instead.
 */
export const queryTypes = {
  /**
   * @deprecated use `parseAsString` instead.
   */
  string: parseAsString,
  /**
   * @deprecated use `parseAsInteger` instead.
   */
  integer: parseAsInteger,
  /**
   * @deprecated use `parseAsFloat` instead.
   */
  float: parseAsFloat,
  /**
   * @deprecated use `parseAsBoolean` instead.
   */
  boolean: parseAsBoolean,
  /**
   * @deprecated use `parseAsTimestamp` instead.
   */
  timestamp: parseAsTimestamp,
  /**
   * @deprecated use `parseAsIsoDateTime` instead.
   */
  isoDateTime: parseAsIsoDateTime,
  /**
   * @deprecated use `parseAsStringEnum` instead.
   */
  stringEnum: parseAsStringEnum,
  /**
   * @deprecated use `parseAsJson` instead.
   */
  json: parseAsJson,
  /**
   * @deprecated use `parseAsArrayOf` instead.
   */
  array: parseAsArrayOf
} as const

/**
 * @deprecated use individual `parseAsXyz` imports instead
 */
export type QueryTypeMap = typeof queryTypes
