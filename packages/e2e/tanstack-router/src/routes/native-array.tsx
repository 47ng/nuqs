import { createFileRoute } from '@tanstack/react-router'
import { NativeArray, parser } from 'e2e-shared/specs/native-array'
import { createStandardSchemaV1 } from 'nuqs'

const validateSearch = createStandardSchemaV1(
  { test: parser },
  { partialOutput: true }
)

export const Route = createFileRoute('/native-array')({
  component: NativeArray,
  validateSearch
})
