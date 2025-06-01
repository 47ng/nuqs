import { withPagesReadyWrapper } from '@/components/pages-ready-wrapper'
import { UseQueryStateBasicIO } from 'e2e-shared/specs/basic-io'
import { NuqsAdapter } from 'nuqs/adapters/next'

const BasicIO = withPagesReadyWrapper(UseQueryStateBasicIO)

export default function Page() {
  return (
    <NuqsAdapter>
      <BasicIO />
    </NuqsAdapter>
  )
}
