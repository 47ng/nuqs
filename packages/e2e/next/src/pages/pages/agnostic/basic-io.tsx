import { UseQueryStateBasicIO } from 'e2e-shared/specs/basic-io'
import { NuqsAdapter } from 'nuqs/adapters/next'

export default function Page() {
  return (
    <NuqsAdapter>
      <UseQueryStateBasicIO />
    </NuqsAdapter>
  )
}
