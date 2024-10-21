import type { RehypeCodeOptions } from 'fumadocs-core/mdx-plugins'

export const rehypeCodeOptions: RehypeCodeOptions = {
  themes: {
    light: 'catppuccin-latte',
    dark: 'catppuccin-mocha'
  },
  inline: 'tailing-curly-colon',
  defaultColor: false
}
