import type { ComponentProps } from 'react'
import { cn } from '@/src/lib/utils'

export function Testimonial({
  className,
  ...props
}: ComponentProps<'figure'>) {
  return (
    <figure
      data-slot="testimonial"
      className={cn('flex h-full flex-col', className)}
      {...props}
    />
  )
}

export function TestimonialQuote({
  className,
  ...props
}: ComponentProps<'blockquote'>) {
  return (
    <blockquote
      data-slot="testimonial-quote"
      className={cn('grow text-sm leading-relaxed', className)}
      {...props}
    />
  )
}

export function TestimonialAuthor({
  className,
  ...props
}: ComponentProps<'figcaption'>) {
  return (
    <figcaption
      data-slot="testimonial-author"
      className={cn('mt-4 grid grid-cols-[auto_1fr] items-center gap-3', className)}
      {...props}
    />
  )
}

export function TestimonialAvatar({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="testimonial-avatar"
      className={cn('relative size-9', className)}
      {...props}
    />
  )
}

export function TestimonialAvatarImg({
  className,
  ...props
}: ComponentProps<'img'>) {
  return (
    <img
      data-slot="testimonial-avatar-img"
      className={cn('size-full rounded-full object-cover', className)}
      {...props}
    />
  )
}

export function TestimonialAvatarRing({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="testimonial-avatar-ring"
      className={cn(
        'absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/10',
        className
      )}
      {...props}
    />
  )
}

export function TestimonialAuthorName({
  className,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span
      data-slot="testimonial-author-name"
      className={cn('text-sm font-semibold', className)}
      {...props}
    />
  )
}

export function TestimonialAuthorTagline({
  className,
  ...props
}: ComponentProps<'span'>) {
  return (
    <span
      data-slot="testimonial-author-tagline"
      className={cn('text-xs text-zinc-500 dark:text-zinc-400', className)}
      {...props}
    />
  )
}
