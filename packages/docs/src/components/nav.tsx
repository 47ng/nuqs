import { GithubIcon } from 'lucide-react'
import type { NavItemProps, NavLinkProps } from 'next-docs-ui/nav'

export const navItems: NavItemProps[] = [
  {
    href: '/docs',
    children: <span className="ml-6 px-3">Docs</span>
  },
  {
    href: '/playground',
    children: <span className="px-3">Playground</span>
  }
]

export const navLinks: NavLinkProps[] = [
  {
    label: 'GitHub',
    icon: <GithubIcon className="h-5 w-5" />,
    href: 'https://github.com/47ng/next-usequerystate',
    external: true
  }
]
