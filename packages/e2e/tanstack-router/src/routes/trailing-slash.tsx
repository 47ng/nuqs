import { createFileRoute } from '@tanstack/react-router'
import { createStandardSchemaV1, parseAsString, useQueryStates } from 'nuqs'

const declared = {
  declared: parseAsString
}
const undeclared = {
  undeclared: parseAsString
}

const searchParams = {
  ...declared,
  ...undeclared
}

export const Route = createFileRoute('/trailing-slash')({
  validateSearch: createStandardSchemaV1(declared, {
    partialOutput: true
  }),
  component: TrailingSlashTest
})

function TrailingSlashTest() {
  const [{ declared, undeclared }, setSearchParams] =
    useQueryStates(searchParams)
  return (
    <div>
      <button
        onClick={() => {
          setSearchParams({
            declared: 'pass'
          })
        }}
      >
        Set declared
      </button>
      <button
        onClick={() => {
          setSearchParams({
            undeclared: 'pass'
          })
        }}
      >
        Set undeclared
      </button>
      <button onClick={() => setSearchParams(null)}>Clear</button>
      <pre>{JSON.stringify({ declared, undeclared }, null, 2)}</pre>
    </div>
  )
}
