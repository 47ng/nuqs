import { setTimeout } from 'node:timers/promises'

async function fakeDataFetching() {
  await setTimeout(1000)
  return 'fake data'
}

export default async function Layout({
  children
}: {
  children: React.ReactNode
}) {
  const fakeDataPromise = fakeDataFetching()
  return (
    <>
      {children}
      <p>This should be static: {fakeDataPromise}</p>
    </>
  )
}
