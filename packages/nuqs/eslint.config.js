import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReactConfig from 'eslint-plugin-react/configs/recommended.js'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import pluginReactCompiler from 'eslint-plugin-react-compiler'

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReactConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-useless-escape': 'off'
    }
  },
  {
    settings: {
      react: {
        version: 'detect'
      }
    },
    plugins: {
      'react-hooks': pluginReactHooks,
      'react-compiler': pluginReactCompiler
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      'react-compiler/react-compiler': 'error'
    }
  },
  { ignores: ['**/*.test-d.ts'] }
]
