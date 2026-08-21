import type { RehypeCodeOptions } from 'fumadocs-core/mdx-plugins'
import type { ShikiTransformer } from 'shiki'

const withoutItalics: ShikiTransformer = {
  name: 'without-italics',
  tokens(lines) {
    for (const line of lines) {
      for (const token of line) {
        if (typeof token.htmlStyle !== 'object') {
          continue
        }
        for (const key of Object.keys(token.htmlStyle)) {
          if (key.endsWith('font-style')) {
            delete token.htmlStyle[key]
          }
        }
      }
    }
  }
}

export const rehypeCodeOptions: RehypeCodeOptions = {
  themes: {
    light: 'catppuccin-latte',
    dark: 'catppuccin-mocha'
  },
  inline: 'tailing-curly-colon',
  defaultColor: false,
  transformers: [withoutItalics]
}
