import { Suspense } from 'react'
import { QuineDynamic } from './components/quine-dynamic'
import { QuineStatic } from './components/quine-static'

export default function Home() {
  return (
    <>
      <h1>Next.js 16 w/ cacheComponents + nuqs</h1>
      <section>
        <h2>Dynamic Quine (with Suspense)</h2>
        <Suspense fallback={<div>Loading...</div>}>
          <QuineDynamic />
        </Suspense>
      </section>
      <section>
        <h2>Static Quine (with "use cache")</h2>
        <QuineStatic />
      </section>
    </>
  )
}
