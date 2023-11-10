import { GetServerSideProps } from 'next'
import { parseAsString } from 'next-usequerystate'
import IntegrationPage from '../../index'
export default IntegrationPage

export const getServerSideProps = (async ctx => {
  const string = parseAsString.parseServerSide(ctx.query.string)
  console.dir({ string })
  return {
    props: {
      string
    }
  }
}) satisfies GetServerSideProps<{
  string: string | null
}>
