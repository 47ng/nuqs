import {
  NextJS,
  ReactRouter,
  ReactSPA,
  Remix,
  TanStackRouter,
  Vitest
} from '@/src/components/frameworks'
import { cn } from '@/src/lib/utils'
import { ComponentProps } from 'react'

export function WorksWith({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center gap-6 text-3xl', className)}
      {...props}
    >
      <p className="sr-only">Works with</p>
      {/* <Vite /> */}
      <ReactSPA />
      <ReactRouter />
      <NextJS />
      <Remix />
      <TanStackRouter />
      <Vitest />
    </div>
  )
}
