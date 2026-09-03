import { createIsolatedPage } from '@/components/isolated-page'
import { withPagesReadyWrapper } from '@/components/pages-ready-wrapper'
import { UseQueryStateBasicIO } from 'e2e-shared/specs/basic-io'

const BasicIO = withPagesReadyWrapper(UseQueryStateBasicIO)

export default createIsolatedPage(<BasicIO />)
