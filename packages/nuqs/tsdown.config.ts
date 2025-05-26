import { defineConfig, type Options, type UserConfig } from 'tsdown'

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
    'react-router'
  ],
  treeshake: false,
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
    'adapters/react-router/v6': 'src/adapters/react-router/v6.ts',
    'adapters/react-router/v7': 'src/adapters/react-router/v7.ts',
    'adapters/custom': 'src/adapters/custom.ts',
    'adapters/testing': 'src/adapters/testing.ts'
  },
  server: {
    server: 'src/index.server.ts',
    testing: 'src/testing.ts'
  }
}

const config: UserConfig = defineConfig([
  // Client bundles
  {
    ...commonConfig,
    entry: entrypoints.client,
    outputOptions: {
      intro: ({ isEntry }) => (isEntry ? "'use client';\n" : '')
    }
  },
  // Server bundle
  {
    ...commonConfig,
    entry: entrypoints.server
  }
]) as UserConfig

export default config
