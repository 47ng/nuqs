import {
  type SearchParams,
  LoaderRenderer,
  loadSearchParams
} from 'e2e-shared/specs/loader'
import type { GetServerSidePropsContext } from 'next'

type PageProps = {
  serverValues: SearchParams
}

export default function Page({ serverValues }: PageProps) {
  return <LoaderRenderer serverValues={serverValues} />
}

export async function getServerSideProps({ query }: GetServerSidePropsContext) {
  return {
    props: {
      serverValues: loadSearchParams(query)
    }
  }
}
