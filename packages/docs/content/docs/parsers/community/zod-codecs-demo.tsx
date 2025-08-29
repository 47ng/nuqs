'use client'

import { createParser, useQueryState } from 'nuqs' // or 'nuqs/server'
import { z } from 'zod'

function createZodCodecParser<
  Input extends z.ZodCoercedString<string> | z.ZodPipe<any, any>,
  Output extends z.ZodType
>(
  codec: z.ZodCodec<Input, Output> | z.ZodPipe<Input, Output>,
  eq: (a: z.output<Output>, b: z.output<Output>) => boolean = (a, b) => a === b
) {
  return createParser<z.output<Output>>({
    parse(query) {
      return codec.parse(query)
    },
    serialize(value) {
      return codec.encode(value)
    },
    eq
  })
}

// --

// All parsers from the Zod docs:
const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString)
      } catch (err: any) {
        ctx.issues.push({
          code: 'invalid_format',
          format: 'json',
          input: jsonString,
          message: err.message
        })
        return z.NEVER
      }
    },
    encode: value => JSON.stringify(value)
  })

const base64urlToBytes = z.codec(z.base64url(), z.instanceof(Uint8Array), {
  decode: base64urlString => z.util.base64urlToUint8Array(base64urlString),
  encode: bytes => z.util.uint8ArrayToBase64url(bytes)
})

const utf8ToBytes = z.codec(z.string(), z.instanceof(Uint8Array), {
  decode: str => new TextEncoder().encode(str),
  encode: bytes => new TextDecoder().decode(bytes)
})
const bytesToUtf8 = invertCodec(utf8ToBytes)

// --

function invertCodec<A extends z.ZodType, B extends z.ZodType>(
  codec: z.ZodCodec<A, B>
): z.ZodCodec<B, A> {
  return z.codec<B, A>(codec.out, codec.in, {
    decode(value, ctx) {
      try {
        return codec.encode(value)
      } catch (err) {
        ctx.issues.push({
          code: 'invalid_format',
          format: 'invert.decode',
          input: String(value),
          message: err instanceof z.ZodError ? err.message : String(err)
        })
        return z.NEVER
      }
    },
    encode(value, ctx) {
      try {
        return codec.decode(value)
      } catch (err) {
        ctx.issues.push({
          code: 'invalid_format',
          format: 'invert.encode',
          input: String(value),
          message: err instanceof z.ZodError ? err.message : String(err)
        })
        return z.NEVER
      }
    }
  })
}

// --

const userSchema = z.object({
  name: z.string(),
  age: z.number()
})

// Composition always wins.
const codec = base64urlToBytes.pipe(bytesToUtf8).pipe(jsonCodec(userSchema))

const parser = createZodCodecParser(codec)

export function ZodCodecsDemo() {
  const [user, setUser] = useQueryState(
    'user',
    parser.withDefault({
      name: 'John Doe',
      age: 42
    })
  )
  return (
    <>
      <input
        type="text"
        value={user.name}
        onChange={e => setUser(old => ({ ...old, name: e.target.value }))}
      />
      <input
        type="number"
        value={user.age}
        onChange={e =>
          setUser(old => ({ ...old, age: Number(e.target.value) }))
        }
      />
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  )
}
