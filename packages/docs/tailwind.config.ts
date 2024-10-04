import headlessUI from '@headlessui/tailwindcss'
import containerQueries from '@tailwindcss/container-queries'
import { createPreset as createFumadocsPreset } from 'fumadocs-ui/tailwind-plugin'
import type { Config } from 'tailwindcss'
import tailwindAnimate from 'tailwindcss-animate'
import shadcnPreset from './tailwind.shadcn'
import tremorPreset from './tailwind.tremor'

const tailwindConfig: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.tsx',
    './content/**/*.mdx',
    './content/**/*.tsx',
    './mdx-components.tsx',
    './node_modules/fumadocs-ui/dist/**/*.js',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    }
  },
  presets: [
    createFumadocsPreset({
      layoutWidth: '1600px'
    }),
    shadcnPreset,
    tremorPreset
  ],
  plugins: [tailwindAnimate, containerQueries, headlessUI]
}

export default tailwindConfig
