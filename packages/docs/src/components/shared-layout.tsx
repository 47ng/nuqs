import { NuqsWordmark } from '@/src/components/logo'
import type { HomeLayoutProps } from 'fumadocs-ui/layouts/home'

export function getSharedLayoutProps(): HomeLayoutProps {
  return {
    githubUrl: 'https://github.com/47ng/nuqs',
    nav: {
      title: <NuqsWordmark className="ml-2 text-lg" />,
      transparentMode: 'top'
    },
    links: [
      {
        text: 'Documentation',
        url: '/docs'
      },
      {
        text: 'Playground',
        url: '/playground'
      },
      {
        text: 'Blog',
        url: '/blog'
      }
    ]
  }
}
