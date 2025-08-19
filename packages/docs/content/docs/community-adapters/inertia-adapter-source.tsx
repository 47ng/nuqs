import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

export async function InertiaAdapterSource() {
  let source = await fetch(
    'https://raw.githubusercontent.com/47ng/nuqs-inertia-pingcrm/refs/heads/with-nuqs/resources/js/lib/nuqs-inertia-adapter.ts'
  ).then((res) => res.text())
  // todo: Add a PR on Fumadocs to support a title prop on DynamicCodeBlock
  // or use the server component which should support a title.
  // https://fumadocs.dev/docs/ui/components/dynamic-codeblock#server-component
  source = `// resources/js/lib/nuqs-inertia-adapter.ts\n\n` + source.trim()
  return <DynamicCodeBlock lang="ts" code={source} />
}
