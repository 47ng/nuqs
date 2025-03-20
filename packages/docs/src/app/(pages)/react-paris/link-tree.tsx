import { Button } from '@/src/components/ui/button'
import Link from 'next/link'
import { ReactNode } from 'react'

export type LinkTreeItemProps = {
  href: string
  icon: ReactNode
  label: ReactNode
}

export function LinkTreeItem({ href, icon, label }: LinkTreeItemProps) {
  const isLocalRoute = href.startsWith('/')
  return (
    <li>
      <Button
        asChild
        variant="outline"
        className="flex w-full items-center justify-center gap-3 py-6 text-lg transition-all hover:scale-[1.01]"
      >
        <Link
          href={href}
          target={isLocalRoute ? undefined : '_blank'}
          rel={isLocalRoute ? undefined : 'noopener noreferrer'}
        >
          {icon}
          <span>{label}</span>
        </Link>
      </Button>
    </li>
  )
}

type LinkTreeProps = {
  items: LinkTreeItemProps[]
}

export function LinkTree({ items }: LinkTreeProps) {
  return (
    <ul className="space-y-4">
      {items.map((item, index) => (
        <LinkTreeItem key={index} {...item} />
      ))}
    </ul>
  )
}
