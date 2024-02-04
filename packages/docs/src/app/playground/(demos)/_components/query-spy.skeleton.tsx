import { twMerge } from 'tailwind-merge'

export function QuerySpySkeleton({
  children,
  className,
  ...props
}: React.ComponentProps<'pre'>) {
  return (
    <pre
      aria-label="Querystring spy"
      aria-description="For browsers where the query is hard to see (eg: on mobile)"
      className={twMerge(
        'mt-4 block w-full overflow-x-auto rounded-lg border bg-background px-3 py-2 text-xs dark:bg-zinc-900/50 dark:shadow-inner sm:text-sm',
        className
      )}
      {...props}
    >
      {children}
    </pre>
  )
}
