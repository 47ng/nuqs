import { NuqsWordmark } from '@/src/components/logo'
import type { HomeLayoutProps } from 'fumadocs-ui/home-layout'

export function getSharedLayoutProps(): HomeLayoutProps {
  return {
    githubUrl: 'https://github.com/47ng/nuqs',
    nav: {
      title: <NuqsWordmark className="text-lg" />
    },
    links: [
      {
        text: 'Documentation',
        url: '/docs'
      },
      {
        text: 'Playground',
        url: '/playground'
      }
    ]
  }
}
