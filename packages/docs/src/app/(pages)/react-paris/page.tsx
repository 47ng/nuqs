import { Logo47ng } from '@/src/components/47ng'
import { ReactParisLogo } from '@/src/components/react-paris'
import { SiBluesky, SiDiscord } from '@icons-pack/react-simple-icons'
import {
  Github,
  Images,
  Library,
  Linkedin,
  Mail,
  Twitter,
  Youtube
} from 'lucide-react'
import { LinkTree, LinkTreeItemProps } from './link-tree'

const links: LinkTreeItemProps[] = [
  {
    href: 'https://discord.com/channels/723276276072317098/1352179917680283743',
    icon: <SiDiscord className="size-5" />,
    label: <>Questions & Feedback 🙏</>
  },
  {
    href: '/',
    icon: <Library className="size-5" />,
    label: 'Documentation'
  },
  {
    href: 'https://github.com/47ng/nuqs',
    icon: <Github className="size-5" />,
    label: (
      <>
        GitHub{' '}
        <span className="text-muted-foreground text-sm">
          (give nuqs a star! ⭐)
        </span>
      </>
    )
  },
  {
    href: 'https://github.com/franky47/react-paris-25-demo',
    icon: <Github className="size-5" />,
    label: 'Demo app'
  },
  {
    href: 'https://nuqs.dev/react-paris-25-slides.pdf',
    icon: <Images className="size-5" />,
    label: 'Slides'
  },
  {
    href: 'https://bsky.app/profile/francoisbest.com',
    icon: <SiBluesky className="size-5" />,
    label: (
      <>
        Bluesky{' '}
        <span className="text-muted-foreground text-sm">@francoisbest.com</span>
      </>
    )
  },
  {
    href: 'https://bsky.app/profile/nuqs.dev',
    icon: <SiBluesky className="size-5" />,
    label: (
      <>
        Bluesky <span className="text-muted-foreground text-sm">@nuqs.dev</span>
      </>
    )
  },
  {
    href: 'https://www.youtube.com/@47ng-dev',
    icon: <Youtube className="size-5" />,
    label: 'YouTube'
  },
  {
    href: 'https://www.linkedin.com/in/francoisbest/',
    icon: <Linkedin className="size-5" />,
    label: <>LinkedIn</>
  },
  {
    href: 'mailto:nuqs@47ng.com',
    icon: <Mail className="size-5" />,
    label: 'Contact me'
  },
  {
    href: 'https://x.com/nuqs47ng',
    icon: <Twitter className="size-5" />,
    label: (
      <>
        Twitter <span className="text-muted-foreground text-sm">@nuqs47ng</span>
      </>
    )
  },
  {
    href: 'https://x.com/fortysevenfx',
    icon: <Twitter className="size-5" />,
    label: (
      <>
        Twitter{' '}
        <span className="text-muted-foreground text-sm">
          @fortysevenfx (archived)
        </span>
      </>
    )
  }
]

export default function Page() {
  return (
    <section className="container max-w-lg py-12">
      <div className="flex items-center justify-center gap-12">
        <Logo47ng className="size-16" />
        <ReactParisLogo className="-mx-4 mb-4 size-24 translate-y-1.5" />
      </div>
      <p className="mb-2 text-center">Thanks for attending my talk! 🫶</p>
      <p className="mb-8 text-center text-balance">
        Here are some useful links to learn more about nuqs, and how to find me
        on social media:
      </p>
      <LinkTree items={links} />
    </section>
  )
}
