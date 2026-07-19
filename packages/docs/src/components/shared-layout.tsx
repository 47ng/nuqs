import { BrandAssetsMenu } from '@/src/components/brand-assets-menu'
import { NuqsWordmark } from '@/src/components/logo'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function getSharedLayoutProps(): BaseLayoutProps {
  return {
    githubUrl: 'https://github.com/47ng/nuqs',
    nav: {
      title: (
        <BrandAssetsMenu>
          <NuqsWordmark className="ml-2 text-xl" />
        </BrandAssetsMenu>
      ),
      transparentMode: 'top'
    },
    // fumadocs-ui defaults to a two-state light/dark toggle since 16.7;
    // restore the 3-way switch with the system option
    themeSwitch: {
      mode: 'light-dark-system'
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
  start-aligned in the main grid track; center them like before.
*/
export const docsPageClassName = '*:mx-auto *:w-full'

/*
  Playground pages were full-bleed before the DocsPage wrapper became
  structurally required; lift the 900px child cap (important beats the
  container's *:max-w-[900px] regardless of stylesheet order).
*/
export const fullBleedPageClassName = `${docsPageClassName} *:max-w-none!`
