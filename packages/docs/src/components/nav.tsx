import { GithubIcon } from 'lucide-react'
import type { NavItemProps, NavLinkProps } from 'next-docs-ui/nav'

export const navItems: NavItemProps[] = [
  {
    href: '/docs',
    children: <span className="flex w-32 justify-center">Documentation</span>
  },
  {
    href: '/playground',
    children: <span className="flex w-28 justify-center">Playground</span>
  }
]

export const navLinks: NavLinkProps[] = [
  {
    label: 'GitHub',
    icon: <GithubIcon className="h-5 w-5" />,
    href: 'https://github.com/47ng/nuqs',
    external: true
  }
]
