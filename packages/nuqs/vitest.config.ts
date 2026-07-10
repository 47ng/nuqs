import { playwright } from '@vitest/browser-playwright'
import { readFile } from 'node:fs/promises'
import { normalizePath, type Plugin } from 'vite'
import { defineConfig, type ViteUserConfig } from 'vitest/config'

const pkgDir = normalizePath(import.meta.dirname)
const srcDir = pkgDir + '/src'
const copyPrefix = '/@nuqs-copy-b'

/**
 * Serves a second, independent copy of the library source graph under the
 * virtual `nuqs-copy-b` specifier, while sharing bare imports (react, etc.).
 * This simulates a monorepo loading two physical copies of nuqs (issue #798)
 * for the duplicate-copies tests.
 */
function duplicateLibraryCopy(): Plugin {
  return {
    name: 'nuqs:duplicate-library-copy',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (source === 'nuqs-copy-b') {
        // The dependency scanner has no load hook for virtual modules,
        // keep it from aborting the pre-bundling scan (see optimizeDeps).
        if ('scan' in options && options.scan) {
          return { id: source, external: true }
        }
        return copyPrefix + srcDir + '/index.ts'
      }
      if (source.startsWith(copyPrefix)) {
        return source
      }
      if (importer?.startsWith(copyPrefix)) {
        const resolved = await this.resolve(
          source,
          importer.slice(copyPrefix.length),
          { skipSelf: true }
        )
        if (resolved?.id.startsWith(srcDir)) {
          return copyPrefix + resolved.id
        }
        if (
          resolved &&
          !resolved.external &&
          resolved.id.startsWith(pkgDir) &&
          !resolved.id.includes('/node_modules/')
        ) {
          // A src-internal module escaping the prefix would be shared by
          // module identity, silently defeating the duplicate-copies tests.
          this.error(
            `duplicateLibraryCopy leak: ${source} (from ${importer}) resolved outside the copy graph: ${resolved.id}`
          )
        }
        return resolved?.id
      }
    },
    load(id) {
      if (id.startsWith(copyPrefix)) {
        return readFile(id.slice(copyPrefix.length), 'utf8')
      }
    }
  }
}

const config: ViteUserConfig = defineConfig({
  plugins: [duplicateLibraryCopy()],
  optimizeDeps: {
    exclude: ['nuqs-copy-b']
  },
  define: {
    /**
     * We need to polyfill process.env because it is not meant to exist by default in a browser.
     * @see https://github.com/vitest-dev/vitest/issues/6872
     */
    'process.env': JSON.stringify({})
  },
  test: {
    setupFiles: ['vitest.setup.ts'],
    exclude: ['node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        './src/adapters/**', // adapters are tested in e2e tests
        './tests/**.test-d.ts', // type tests don't generate coverage
        './**/*.d.ts' // neither do type definitions
      ]
    },
    env: {
      IS_REACT_ACT_ENVIRONMENT: 'true'
    },
    projects: [
      {
        extends: true,
        test: {
          setupFiles: ['vitest.setup.ts', 'vitest.browser.setup.ts'],
          name: 'browser',
          include: ['**/*.browser.test.?(c|m)[jt]s?(x)'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false
          }
        }
      },
      {
        // Tests that are meant to work in a non-browser environment.
        extends: true,
        test: {
          environment: 'node',
          name: 'unit',
          include: ['**/*.test.?(c|m)[jt]s?(x)'],
          exclude: ['**/*.browser.test.?(c|m)[jt]s?(x)']
        }
      },
      {
        extends: true,
        test: {
          name: 'types',
          typecheck: {
            enabled: true,
            only: true
          }
        }
      }
    ]
  }
})

export default config
