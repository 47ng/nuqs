import { docsUi, docsUiPlugins } from 'next-docs-ui/tailwind-plugin'
import type { Config } from 'tailwindcss'

const tailwindConfig: Config = {
  darkMode: 'class',
  content: [
    './node_modules/next-docs-ui/dist/**/*.js',
    './app/**/*.tsx',
    './content/**/*.mdx',
    './mdx-components.tsx'
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Geist Sans', 'Inter', 'sans-serif']
      }
    }
  },
  plugins: [...docsUiPlugins, docsUi]
}

export default tailwindConfig
