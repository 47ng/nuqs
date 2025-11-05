import { CodeBlock } from '@/src/components/code-block'
import { SiTypescript } from '@icons-pack/react-simple-icons'
import { cacheLife } from 'next/cache'

export async function InertiaAdapterSource() {
  'use cache'
  cacheLife('static')
  const source = await fetch(
    'https://raw.githubusercontent.com/47ng/nuqs-inertia-pingcrm/refs/heads/with-nuqs/resources/js/lib/nuqs-inertia-adapter.ts'
  ).then(res => res.text())
  return (
    <CodeBlock
      lang="ts"
      icon={<SiTypescript size={14} />}
      code={source.trim()}
      title="resources/js/lib/nuqs-inertia-adapter.ts"
    />
  )
}
