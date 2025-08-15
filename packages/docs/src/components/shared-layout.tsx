import { NuqsWordmark } from '@/src/components/logo'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function getSharedLayoutProps(): BaseLayoutProps {
  return {
    githubUrl: 'https://github.com/47ng/nuqs',
    nav: {
      title: <NuqsWordmark className="ml-2 text-lg" />,
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
        text: 'Blog',
        url: '/blog',
        active: 'nested-url'
      }
    ]
  }
}
