import { cn } from '@/src/lib/utils'
import type { ComponentProps } from 'react'

// Server-rendered take on the Dice UI timeline anatomy
// (https://diceui.com/docs/components/radix/timeline): same part names,
// vertical orientation only, last connector hidden in CSS instead of a store.

export function Timeline({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="list"
      data-slot="timeline"
      className={cn('flex flex-col', className)}
      {...props}
    />
  )
}

export function TimelineItem({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      role="listitem"
      data-slot="timeline-item"
      className={cn(
        'group/timeline-item relative flex gap-3 pb-8 last:pb-0',
        className
      )}
      {...props}
    />
  )
}

export function TimelineDot({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-dot"
      className={cn(
        'border-primary bg-background z-10 size-3.5 shrink-0 rounded-full border-2',
        className
      )}
      {...props}
    />
  )
}

export function TimelineConnector({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      data-slot="timeline-connector"
      className={cn(
        'bg-border absolute top-3 bottom-0 left-1.5 w-0.5 group-last/timeline-item:hidden',
        className
      )}
      {...props}
    />
  )
}

export function TimelineContent({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-content"
      className={cn('flex-1', className)}
      {...props}
    />
  )
}

export function TimelineHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-header"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  )
}

export function TimelineTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

export function TimelineTime({ className, ...props }: ComponentProps<'time'>) {
  return (
    <time
      data-slot="timeline-time"
      className={cn('text-muted-foreground text-xs', className)}
      {...props}
    />
  )
}

export function TimelineDescription({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="timeline-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}
