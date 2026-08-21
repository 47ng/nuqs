import { BrandAssetsMenu } from '@/src/components/brand-assets-menu'
import { NuqsWordmark } from '@/src/components/logo'
import { ThemeToggleMenu } from '@/src/components/theme-toggle-menu'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function getSharedLayoutProps(): BaseLayoutProps {
  return {
    githubUrl: 'https://github.com/47ng/nuqs',
    themeSwitch: { component: <ThemeToggleMenu /> },
    nav: {
      title: (
        <BrandAssetsMenu>
          <NuqsWordmark className="ml-2 text-xl" />
        </BrandAssetsMenu>
      ),
      transparentMode: 'top'
    },
    links: [
      {
        text: 'Documentation',
        url: '/docs',
        active: 'nested-url'
      },
      {
        text: 'Playground',
        url: '/playground',
        active: 'nested-url'
      },
      {
        text: 'Registry',
        url: '/registry',
        active: 'nested-url'
      },
      {
        text: 'Blog',
        url: '/blog',
        active: 'nested-url'
      }
    ]
  }
}

/*
  fumadocs-ui 16.11 caps DocsPage children at 900px but leaves them
  start-aligned in the main grid track, and pads the article 24px on
  mobile and 56px on xl screens. Center the children and keep the 32px
  top padding it had at every breakpoint. fumadocs merges class
  conflicts per variant, so `xl:pt-8` is what removes the container's
  `xl:pt-14`; a bare `pt-8` would lose on xl screens.
*/
export const docsPageClassName = 'pt-8 xl:pt-8 *:mx-auto *:w-full'

/*
  Playground pages were full-bleed before the DocsPage wrapper became
  structurally required; lift the 900px child cap (important beats the
  container's *:max-w-[900px] regardless of stylesheet order).
*/
export const fullBleedPageClassName = `${docsPageClassName} *:max-w-none!`
