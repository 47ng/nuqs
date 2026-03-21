import type { ComponentProps } from 'react'
import FastMarquee from 'react-fast-marquee'
import { cn } from '@/src/lib/utils'

export function Marquee({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="marquee"
      className={cn('relative overflow-hidden', className)}
      {...props}
    />
  )
}

export function MarqueeContent({
  className,
  ...props
}: ComponentProps<typeof FastMarquee>) {
  return (
    <FastMarquee
      data-slot="marquee-content"
      pauseOnHover
      speed={30}
      className={className}
      {...props}
    />
  )
}

export function MarqueeFade({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="marquee-fade"
      className={cn(
        'pointer-events-none absolute inset-y-0 z-10 w-16 sm:w-24',
        className
      )}
      {...props}
    />
  )
}

export function MarqueeFadeLeft({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <MarqueeFade
      className={cn(
        'left-0 bg-gradient-to-r from-white dark:from-zinc-950',
        className
      )}
      {...props}
    />
  )
}

export function MarqueeFadeRight({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <MarqueeFade
      className={cn(
        'right-0 bg-gradient-to-l from-white dark:from-zinc-950',
        className
      )}
      {...props}
    />
  )
}

export function MarqueeItem({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="marquee-item"
      className={cn('flex shrink-0 items-stretch h-full', className)}
      {...props}
    />
  )
}
