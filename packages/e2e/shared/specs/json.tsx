'use client'

import {
  createStandardSchemaV1,
  type inferParserType,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryState
} from 'nuqs'
import { Display } from '../components/display'

// Normally we'd use Zod for a schema, but we can leverage
// the Standard Schema validator instead for a zero-dep validation.
const schema = {
  name: parseAsString.withDefault('init'),
  age: parseAsInteger.withDefault(42)
}
type Schema = inferParserType<typeof schema>
const validate = createStandardSchemaV1(schema)

const defaultValue: Schema = {
  name: schema.name.defaultValue,
  age: schema.age.defaultValue
}

export function Json() {
  const [{ name, age }, setState] = useQueryState(
    'test',
    parseAsJson(validate).withDefault(defaultValue)
  )
  return (
    <>
      <input
        id="name-input"
        type="text"
        value={name}
        onChange={e => setState(old => ({ ...old, name: e.target.value }))}
      />
      <button
        onClick={() => setState(old => ({ name: 'pass', age: old.age + 1 }))}
      >
        Test
      </button>
      <Display environment="client" target="name" state={name} />
      <Display environment="client" target="age" state={age} />
    </>
  )
}
