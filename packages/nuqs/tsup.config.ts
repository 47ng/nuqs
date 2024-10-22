import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineConfig, type Options } from 'tsup'

const commonConfig = {
  format: ['esm'],
  experimentalDts: true,
  outDir: 'dist',
  external: ['next', 'react'],
  splitting: true,
  treeshake: true
} satisfies Options

const entrypoints = {
  client: {
    index: 'src/index.ts',
    'adapters/react': 'src/adapters/react.ts',
    'adapters/next': 'src/adapters/next.ts',
    'adapters/testing': 'src/adapters/testing.ts'
  },
  server: {
    server: 'src/index.server.ts'
  }
}

export default defineConfig([
  // Client bundles
  {
    ...commonConfig,
    entry: entrypoints.client,
    async onSuccess() {
      await Promise.all(
        Object.keys(entrypoints.client).map(async entry => {
          const filePath = join(commonConfig.outDir, `${entry}.js`)
          const fileContents = await readFile(filePath, 'utf-8')
          const withUseClientDirective = `'use client';\n\n${fileContents}`
          await writeFile(filePath, withUseClientDirective)
          console.info(
            `Successfully prepended "use client" directive to ${entry}.`
          )
        })
      )
    }
  },
  // Server bundle
  {
    ...commonConfig,
    entry: entrypoints.server
  }
])
