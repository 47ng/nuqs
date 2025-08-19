import { RenderCount } from 'e2e-shared/specs/render-count'
import {
  loadParams,
  loadSearchParams,
  type Params
} from 'e2e-shared/specs/render-count.params'
import { GetServerSideProps } from 'next'
import { setTimeout } from 'node:timers/promises'

export default RenderCount

// We need SSR to get the correct initial render counts
// otherwise with SSG we get at least one extra render for hydration.
export const getServerSideProps: GetServerSideProps<Params> = async ({
  params,
  query
}) => {
  const { delay } = loadSearchParams(query)
  if (delay) {
    await setTimeout(delay)
  }
  return {
    props: loadParams(params!)
  }
}
