import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, type UserConfig } from 'tsdown'

const commonConfig = {
  clean: true,
  format: ['esm'],
  dts: true,
  outDir: 'dist',
  external: [
    'next',
    'react',
    '@remix-run/react',
    'react-router-dom',
    'react-router',
    '@tanstack/react-router'
  ],
  outExtensions() {
    return {
      js: '.js',
      dts: '.d.ts'
    }
  },
  treeshake: true,
  tsconfig: 'tsconfig.build.json'
} satisfies UserConfig

const entrypoints = {
  client: {
    index: 'src/index.ts',
    'adapters/react': 'src/adapters/react.ts',
    'adapters/next': 'src/adapters/next.ts',
    'adapters/next/app': 'src/adapters/next/app.ts',
    'adapters/next/pages': 'src/adapters/next/pages.ts',
    'adapters/remix': 'src/adapters/remix.ts',
    'adapters/react-router': 'src/adapters/react-router.ts',
    'adapters/react-router/v6': 'src/adapters/react-router/v6.ts',
    'adapters/react-router/v7': 'src/adapters/react-router/v7.ts',
    'adapters/tanstack-router': 'src/adapters/tanstack-router.ts',
    'adapters/custom': 'src/adapters/custom.ts',
    'adapters/testing': 'src/adapters/testing.ts'
  },
  server: {
    server: 'src/index.server.ts',
    testing: 'src/testing.ts'
  }
}

const clientEntryNames = new Set(Object.keys(entrypoints.client))

const config: UserConfig = defineConfig({
  ...commonConfig,
  entry: {
    ...entrypoints.client,
    ...entrypoints.server
  },
  outputOptions: {
    intro: ({ isEntry, fileName }) => {
      if (!isEntry || fileName.endsWith('.d.ts')) return ''
      const entryName = fileName.replace(/\.js$/, '')
      return clientEntryNames.has(entryName) ? "'use client';\n" : ''
    }
  },
  async onSuccess() {
    // Mark the un-versionned React Router adapter as deprecated
    // (will be removed in nuqs@3.0.0).
    const filePath = resolve(
      import.meta.dirname,
      'dist',
      'adapters',
      'react-router.d.ts'
    )
    try {
      const fileContents = await readFile(filePath, 'utf-8')
      const updatedContents = fileContents.replace(
        'export { NuqsAdapter, useOptimisticSearchParams };',
        `export {
  /**
   * @deprecated This import will be removed in nuqs@3.0.0.
   *
   * Please pin your version of React Router in the import:
   * - \`nuqs/adapters/react-router/v6\`
   * - \`nuqs/adapters/react-router/v7\`.
   *
   * Note: this deprecated import (\`nuqs/adapters/react-router\`) is for React Router v6 only.
   */
  NuqsAdapter,
  /**
   * @deprecated This import will be removed in nuqs@3.0.0.
   *
   * Please pin your version of React Router in the import:
   * - \`nuqs/adapters/react-router/v6\`
   * - \`nuqs/adapters/react-router/v7\`.
   *
   * Note: this deprecated import (\`nuqs/adapters/react-router\`) is for React Router v6 only.
   */
  useOptimisticSearchParams
};`
      )
      await writeFile(filePath, updatedContents, 'utf-8')
    } catch (error) {
      console.error('Error updating react-router barrel adapter:', error)
      return
    }
  }
}) as UserConfig

export default config
