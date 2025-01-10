import { KeyIsolationUseQueryState } from 'e2e-shared/specs/key-isolation'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function loader() {
  await wait(100)
  return null
}

export default KeyIsolationUseQueryState
