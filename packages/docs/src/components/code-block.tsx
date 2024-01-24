import { codeToHtml } from 'shikiji'
import { twMerge } from 'tailwind-merge'

type CodeBlockProps = React.ComponentProps<'div'> & {
  code: string
  lang?: 'tsx'
}

export async function CodeBlock({
  code,
  lang = 'tsx',
  className,
  ...props
}: CodeBlockProps) {
  const demoCode = await codeToHtml(code, {
    lang,
    themes: {
      dark: 'github-dark',
      light: 'github-light'
    },
    transformers: [
      {
        name: 'transparent background',
        pre(node) {
          if (typeof node.properties.style !== 'string') {
            return node
          }
          node.properties.style = node.properties.style
            .split(';')
            .filter(style => !style.includes('-bg:'))
            .concat([
              '--shiki-dark-bg:transparent',
              '--shiki-light-bg:transparent'
            ])
            .join(';')
          return node
        }
      }
    ]
  })
  return (
    <div
      className={twMerge(
        'overflow-x-auto rounded-lg border bg-background p-3 text-xs shadow-inner dark:bg-zinc-900 sm:text-sm',
        className
      )}
      dangerouslySetInnerHTML={{ __html: demoCode }}
    />
  )
}
