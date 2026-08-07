import { withPagesReadyWrapper } from '@/components/pages-ready-wrapper'
import { Repro1501 } from 'e2e-shared/specs/repro-1501'
import { useRouter } from 'next/router'

function useRouterValue() {
  const folder = useRouter().query.folder
  return typeof folder === 'string' ? folder : null
}

function Page() {
  return <Repro1501 useRouterValue={useRouterValue} />
}

export const getServerSideProps = () => ({ props: {} })

export default withPagesReadyWrapper(Page)
