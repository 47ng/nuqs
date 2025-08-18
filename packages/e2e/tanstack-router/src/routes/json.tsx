import { createFileRoute } from '@tanstack/react-router'
import { Json, parser } from 'e2e-shared/specs/json'
import { createStandardSchemaV1 } from 'nuqs'

const validateSearch = createStandardSchemaV1(
  { test: parser },
  { partialOutput: true }
)

export const Route = createFileRoute('/json')({
  component: Json,
  validateSearch
})
