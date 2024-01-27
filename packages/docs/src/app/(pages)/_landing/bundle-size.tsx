import { execa } from 'execa'
import path from 'node:path'
import prettyBytes from 'pretty-bytes'

export async function BundleSize() {
  // run the bundle size script from the nuqs package
  const { stdout } = await execa('pnpm', ['run', 'size-limit', '--json'], {
    cwd: path.resolve(process.cwd(), '../../packages/nuqs')
  })
  const [{ size }] = JSON.parse(stdout)
  return <>{prettyBytes(size)}</>
}
