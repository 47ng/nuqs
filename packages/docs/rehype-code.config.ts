import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight
} from '@shikijs/transformers'
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

export const rehypeCodeOptions = {
  themes: {
    light: 'catppuccin-latte',
    dark: 'catppuccin-mocha'
  },
  inline: 'tailing-curly-colon',
  defaultColor: false,
  transformers: [
    transformerNotationHighlight({ matchAlgorithm: 'v3' }),
    transformerNotationWordHighlight({ matchAlgorithm: 'v3' }),
    transformerNotationDiff({ matchAlgorithm: 'v3' }),
    transformerNotationFocus({ matchAlgorithm: 'v3' }),
    withoutItalics
  ]
} satisfies RehypeCodeOptions
