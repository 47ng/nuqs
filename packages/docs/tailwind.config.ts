import headlessUI from '@headlessui/tailwindcss'
import containerQueries from '@tailwindcss/container-queries'
import { docsUi, docsUiPlugins } from 'next-docs-ui/tailwind-plugin'
import type { Config } from 'tailwindcss'
import tailwindAnimate from 'tailwindcss-animate'
import colors from 'tailwindcss/colors'
import { fontFamily } from 'tailwindcss/defaultTheme'
import { CustomThemeConfig } from 'tailwindcss/types/config'

const shadcnThemeExtension: Partial<CustomThemeConfig> = {
  colors: {
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    primary: {
      DEFAULT: 'hsl(var(--primary))',
      foreground: 'hsl(var(--primary-foreground))'
    },
    secondary: {
      DEFAULT: 'hsl(var(--secondary))',
      foreground: 'hsl(var(--secondary-foreground))'
    },
    destructive: {
      DEFAULT: 'hsl(var(--destructive))',
      foreground: 'hsl(var(--destructive-foreground))'
    },
    muted: {
      DEFAULT: 'hsl(var(--muted))',
      foreground: 'hsl(var(--muted-foreground))'
    },
    accent: {
      DEFAULT: 'hsl(var(--accent))',
      foreground: 'hsl(var(--accent-foreground))'
    },
    popover: {
      DEFAULT: 'hsl(var(--popover))',
      foreground: 'hsl(var(--popover-foreground))'
    },
    card: {
      DEFAULT: 'hsl(var(--card))',
      foreground: 'hsl(var(--card-foreground))'
    }
  },
  borderRadius: {
    lg: `var(--radius)`,
    md: `calc(var(--radius) - 2px)`,
    sm: 'calc(var(--radius) - 4px)'
  },
  fontFamily: {
    sans: ['var(--font-sans)', ...fontFamily.sans]
  },
  keyframes: {
    'accordion-down': {
      from: { height: '0' },
      to: { height: 'var(--radix-accordion-content-height)' }
    },
    'accordion-up': {
      from: { height: 'var(--radix-accordion-content-height)' },
      to: { height: '0' }
    }
  },
  animation: {
    'accordion-down': 'accordion-down 0.2s ease-out',
    'accordion-up': 'accordion-up 0.2s ease-out'
  }
}

const tremorThemeExtension: Partial<CustomThemeConfig> = {
  colors: {
    // light mode
    tremor: {
      brand: {
        faint: colors.blue[50],
        muted: colors.blue[200],
        subtle: colors.blue[400],
        DEFAULT: colors.blue[500],
        emphasis: colors.blue[700],
        inverted: colors.white
      },
      background: {
        muted: colors.zinc[50],
        subtle: colors.zinc[100],
        DEFAULT: colors.white,
        emphasis: colors.zinc[700]
      },
      border: {
        DEFAULT: colors.zinc[200]
      },
      ring: {
        DEFAULT: colors.zinc[200]
      },
      content: {
        subtle: colors.zinc[400],
        DEFAULT: colors.zinc[500],
        emphasis: colors.zinc[700],
        strong: colors.zinc[900],
        inverted: colors.white
      }
    },
    // dark mode
    'dark-tremor': {
      brand: {
        faint: '#0B1229',
        muted: colors.blue[950],
        subtle: colors.blue[800],
        DEFAULT: colors.blue[500],
        emphasis: colors.blue[400],
        inverted: colors.blue[950]
      },
      background: {
        muted: '#131A2B',
        subtle: colors.zinc[800],
        DEFAULT: colors.zinc[900],
        emphasis: colors.zinc[300]
      },
      border: {
        DEFAULT: colors.zinc[800]
      },
      ring: {
        DEFAULT: colors.zinc[800]
      },
      content: {
        subtle: colors.zinc[600],
        DEFAULT: colors.zinc[500],
        emphasis: colors.zinc[200],
        strong: colors.zinc[50],
        inverted: colors.zinc[950]
      }
    }
  },
  boxShadow: {
    // light
    'tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'tremor-card':
      '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'tremor-dropdown':
      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    // dark
    'dark-tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'dark-tremor-card':
      '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'dark-tremor-dropdown':
      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
  },
  borderRadius: {
    'tremor-small': '0.375rem',
    'tremor-default': '0.5rem',
    'tremor-full': '9999px'
  },
  fontSize: {
    'tremor-label': ['0.75rem', { lineHeight: '1rem' }],
    'tremor-default': ['0.875rem', { lineHeight: '1.25rem' }],
    'tremor-title': ['1.125rem', { lineHeight: '1.75rem' }],
    'tremor-metric': ['1.875rem', { lineHeight: '2.25rem' }]
  }
}

const tailwindConfig: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.tsx',
    './content/**/*.mdx',
    './content/**/*.tsx',
    './mdx-components.tsx',
    './node_modules/next-docs-ui/dist/**/*.js',
    './node_modules/@tremor/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      ...shadcnThemeExtension,
      ...tremorThemeExtension
    }
  },
  safelist: [
    // {
    //   pattern:
    //     /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    //   variants: ['hover', 'ui-selected']
    // },
    // {
    //   pattern:
    //     /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    //   variants: ['hover', 'ui-selected']
    // },
    // {
    //   pattern:
    //     /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
    //   variants: ['hover', 'ui-selected']
    // },
    // {
    //   pattern:
    //     /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/
    // },
    // {
    //   pattern:
    //     /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/
    // }
    // {
    //   pattern:
    //     /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/
    // }
  ],
  plugins: [
    tailwindAnimate,
    containerQueries,
    ...docsUiPlugins,
    docsUi,
    headlessUI
  ]
}

export default tailwindConfig
