import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { styleText } from 'node:util'
import { defineConfig, type Options } from 'tsup'

const commonConfig = {
  format: ['esm'],
  dts: true,
  outDir: 'dist',
  external: ['next', 'react', '@remix-run/react', 'react-router-dom'],
  splitting: true,
  treeshake: true,
  tsconfig: 'tsconfig.build.json'
} satisfies Options

const entrypoints = {
  client: {
    index: 'src/index.ts',
    'adapters/react': 'src/adapters/react.ts',
    'adapters/next': 'src/adapters/next.ts',
    'adapters/next/app': 'src/adapters/next/app.ts',
    'adapters/next/pages': 'src/adapters/next/pages.ts',
    'adapters/remix': 'src/adapters/remix.ts',
    'adapters/react-router': 'src/adapters/react-router.ts',
    'adapters/custom': 'src/adapters/custom.ts',
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
            [
              styleText('green', 'USE'),
              styleText('bold', filePath.padEnd(29)),
              styleText('dim', 'prepended "use client"')
            ].join(' ')
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
