import { DebounceClient } from 'e2e-shared/specs/debounce-client'
import { DebounceServer } from 'e2e-shared/specs/debounce-server'
import {
  DemoSearchParams,
  loadDemoSearchParams
} from 'e2e-shared/specs/debounce.defs'
import { GetServerSidePropsContext } from 'next'

export default function Page(serverState: DemoSearchParams) {
  return (
    <DebounceServer state={serverState}>
      <DebounceClient navigateHref="/pages/debounce/other" />
    </DebounceServer>
  )
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const serverState = loadDemoSearchParams(ctx.query)
  return {
    props: serverState
  }
}
