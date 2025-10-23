import { LinkTree, type LinkTreeItemProps } from '@/src/components/link-tree'
import {
  SiBluesky,
  SiGithub,
  SiTwitch,
  SiX,
  SiYoutube
} from '@icons-pack/react-simple-icons'
import { Heart, Images, Library, Linkedin } from 'lucide-react'
import { NextJSConf2025Logo } from '../../banners'

const links: LinkTreeItemProps[] = [
  {
    href: '/',
    icon: <Library className="size-5" />,
    label: 'Documentation'
  },
  {
    href: 'https://github.com/47ng/nuqs',
    icon: <SiGithub className="size-5" />,
    detail: '(give nuqs a star! ⭐)',
    label: 'GitHub'
  },
  {
    href: 'https://github.com/franky47/nextjs-conf-25-demo',
    icon: <SiGithub className="size-5" />,
    label: 'Demo app'
  },
  {
    href: 'https://nuqs.dev/nextjs-conf-25-slides.pdf',
    icon: <Images className="size-5" />,
    label: 'Slides'
  },
  {
    href: 'https://github.com/sponsors/franky47',
    icon: <Heart className="size-5 text-pink-600 dark:text-pink-400" />,
    label: 'Sponsor me'
  },
  {
    href: 'https://bsky.app/profile/francoisbest.com',
    icon: <SiBluesky className="size-5 text-sky-500" />,
    label: 'Bluesky',
    detail: '@francoisbest.com'
  },
  {
    href: 'https://bsky.app/profile/nuqs.dev',
    icon: <SiBluesky className="size-5 text-sky-500" />,
    label: 'Bluesky',
    detail: '@nuqs.dev'
  },
  {
    href: 'https://x.com/nuqs47ng',
    icon: <SiX className="size-5" aria-label="X" />,
    label: 'Twitter',
    detail: '@nuqs47ng'
  },
  {
    href: 'https://www.youtube.com/@47ng-dev',
    icon: <SiYoutube className="size-5 text-red-500" />,
    label: 'YouTube'
  },
  {
    href: 'https://www.twitch.tv/fortysevenfx',
    icon: <SiTwitch className="size-5 text-purple-500" />,
    label: 'Twitch'
  },
  {
    href: 'https://www.linkedin.com/in/francoisbest/',
    icon: <Linkedin className="size-5 text-[#0077B5]" />,
    label: 'LinkedIn'
  }
]

export default function Page() {
  return (
    <section className="container max-w-lg py-12">
      <div className="flex items-center justify-center gap-12">
        <NextJSConf2025Logo className="mb-8 w-48" />
      </div>
      <p className="mb-2 text-center">Thanks for attending my talk! 🫶</p>
      <p className="mb-8 text-center text-balance">
        Here are some useful links to learn more about nuqs and to get in touch
        with me:
      </p>
      <LinkTree items={links} />
    </section>
  )
}
