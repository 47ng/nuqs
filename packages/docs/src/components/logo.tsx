import { cn } from '../lib/utils'

export function NuqsWordmark({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      aria-label="nuqs"
      className={cn('whitespace-nowrap', className)}
      {...props}
    >
      <span className="font-light text-zinc-300 dark:text-zinc-700">?</span>
      <span className="font-bold">n</span>
      <span className="font-light text-zinc-300 dark:text-zinc-700">=</span>
      <span className="font-bold">u</span>
      <span className="font-light text-zinc-300 dark:text-zinc-700">&</span>
      <span className="font-bold">q</span>
      <span className="font-light text-zinc-300 dark:text-zinc-700">=</span>
      <span className="font-bold">s</span>
    </span>
  )
}
