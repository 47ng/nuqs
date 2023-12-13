import { docsUi, docsUiPlugins } from 'next-docs-ui/tailwind-plugin'
import type { Config } from 'tailwindcss'

const tailwindConfig: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.tsx',
    './content/**/*.mdx',
    './mdx-components.tsx',
    './node_modules/next-docs-ui/dist/**/*.js'
  ],
  theme: {
    extend: {}
  },
  plugins: [...docsUiPlugins, docsUi]
}

export default tailwindConfig
