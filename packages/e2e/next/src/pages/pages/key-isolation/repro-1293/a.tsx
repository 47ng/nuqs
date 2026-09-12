import { createIsolatedPage } from '@/components/isolated-page'
import { Repro1293PageA } from 'e2e-shared/specs/repro-1293'

export default createIsolatedPage(
  <Repro1293PageA linkHref="/pages/key-isolation/repro-1293/b" />
)
