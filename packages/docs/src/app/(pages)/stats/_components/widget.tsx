import { cn } from '@/src/lib/utils'
import { Card, CardProps } from '@tremor/react'

export type WidgetProps = Omit<CardProps, 'title'> & {
  title: React.ReactNode
}

export function Widget({
  title,

  className,
  children,
  ...props
}: WidgetProps) {
  return (
    <Card
      className={cn('px-4 py-0 pb-2 pt-4 dark:bg-background', className)}
      {...props}
    >
      <h3 className="flex flex-wrap items-center gap-2 text-lg font-bold">
        {title}
      </h3>
      {children}
    </Card>
  )
}
