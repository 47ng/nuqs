import { cn } from '@/src/lib/utils'
import { Fragment, useMemo } from 'react'

export type QuerystringProps = React.ComponentProps<'pre'> & {
  value: string | URLSearchParams
  keepKeys?: string[]
}

export function Querystring({ value, keepKeys, ...props }: QuerystringProps) {
  const search = useMemo(
    () => filterQueryKeys(value, keepKeys),
    [value, keepKeys]
  )
  return (
    <QuerystringSkeleton {...props}>
      {Array.from(search.entries()).map(([key, value], i) => (
        <Fragment key={key + i}>
          <span className="text-zinc-500">
            {i === 0 ? (
              '?'
            ) : (
              <>
                <wbr />&
              </>
            )}
          </span>
          <span className="text-[#005CC5] dark:text-[#79B8FF]">{key}</span>=
          <span className="text-[#D73A49] dark:text-[#F97583]">{value}</span>
        </Fragment>
      ))}
      {search.size === 0 && (
        <span className="text-zinc-500 italic">{'<empty query>'}</span>
      )}
    </QuerystringSkeleton>
  )
}

export function QuerystringSkeleton({
  children,
  className,
  ...props
}: React.ComponentProps<'pre'>) {
  return (
    <pre
      aria-label="Querystring spy"
      aria-description="For browsers where the query is hard to see (eg: on mobile)"
      className={cn(
        'bg-background block w-full overflow-x-auto rounded-lg border px-3 py-2 text-xs text-wrap sm:text-sm dark:bg-zinc-900/50 dark:shadow-inner',
        className
      )}
      {...props}
    >
      {children}
    </pre>
  )
}

function filterQueryKeys(query: string | URLSearchParams, keys?: string[]) {
  const source = new URLSearchParams(query)
  if (!keys || keys.length === 0) {
    return source
  }
  const destination = new URLSearchParams()
  for (const [key, value] of source.entries()) {
    if (keys.includes(key)) {
      destination.append(key, value)
    }
  }
  return destination
}
