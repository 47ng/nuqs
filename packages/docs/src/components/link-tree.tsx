import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'
import Link from 'next/link'
import { ReactNode } from 'react'

export type LinkTreeItemProps = {
  href: string
  icon: ReactNode
  label: ReactNode
  detail?: ReactNode
}

export function LinkTreeItem({ href, icon, label, detail }: LinkTreeItemProps) {
  const isLocalRoute = href.startsWith('/')
  return (
    <li>
      <Button
        asChild
        variant="outline"
        className={cn(
          'flex w-full items-center justify-start gap-3 py-6 text-base transition-all active:scale-[0.99]'
        )}
      >
        <Link
          href={href}
          target={isLocalRoute ? undefined : '_blank'}
          rel={isLocalRoute ? undefined : 'noopener noreferrer'}
        >
          {icon}
          <span className="justify-self-center">{label}</span>
          {detail && (
            <span className="text-muted-foreground ml-auto text-sm">
              {detail}
            </span>
          )}
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
