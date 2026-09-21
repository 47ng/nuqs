import { createParser } from 'nuqs/server'

export type UuidVersion = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/**
 * Parse and validate UUID strings from the query string.
 *
 * By default, accepts any valid UUID format (v1-v8) including the special
 * nil UUID (all zeros) and max UUID (all Fs). You can optionally specify
 * a specific UUID version to validate against.
 *
 * @param opts - Optional configuration object
 * @param opts.version - Specific UUID version to validate (1-8)
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
export function parseAsUuid(opts?: { version?: UuidVersion }) {
  const v = opts?.version
  // Coerce to number in case of user-controlled inputs, to avoid a RegExp DoS
  const versionPattern = v ? `[${+v}]` : '[1-8]'
  const specialUuids = v
    ? ''
    : '|0{8}-0{4}-0{4}-0{4}-0{12}|f{8}-f{4}-f{4}-f{4}-f{12}'
  const uuidRegex = new RegExp(
    `^([0-9a-f]{8}-[0-9a-f]{4}-${versionPattern}[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}${specialUuids})$`,
    'i'
  )
  return createParser({
    parse(query) {
      return uuidRegex.test(query) ? query : null
    },
    serialize: String
  })
}
