import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { parseAsInteger, useQueryState } from '../../../../dist'
import { DemoPageLayout } from '../../../components/demo-page-layout'

export default function ServerSideCounterPage({
  counter: serverSideCounter
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [counter, setCounter] = useQueryState(
    'counter',
    parseAsInteger.withOptions({ shallow: false }).withDefault(0)
  )
  return (
    <DemoPageLayout>
      <h1>Server-side counter</h1>
      <p>
        <em>
          Using pages router & <code>getServerSideProps</code>
        </em>
      </p>
      <button onClick={() => setCounter(x => x - 1)}>-</button>
      <button onClick={() => setCounter(x => x + 1)}>+</button>
      <button onClick={() => setCounter(null)}>Reset</button>
      <p>Client counter: {counter}</p>
      <p>Server counter: {serverSideCounter}</p>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/blob/next/src/pages/demos/pages/server-side-counter.tsx">
          Source on GitHub
        </a>
      </p>
    </DemoPageLayout>
  )
}

export const getServerSideProps = (async ctx => {
  return {
    props: {
      counter: parseAsInteger.withDefault(0).parseServerSide(ctx.query.counter)
    }
  }
}) satisfies GetServerSideProps<{
  counter: number
}>
