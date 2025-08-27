import { cn } from '@/src/lib/utils'
import { ComponentProps } from 'react'

export function GraphSkeleton({ className }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex h-69 w-full animate-pulse flex-col justify-between pt-1 pr-1 pl-10 opacity-50',
        className
      )}
    >
      <hr />
      <hr />
      <hr />
      <hr />
      <hr />
    </div>
  )
}
