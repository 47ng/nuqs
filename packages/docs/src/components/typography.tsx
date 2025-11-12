import { cn } from '@/src/lib/utils'
import { Link } from 'lucide-react'
import NextLink from 'next/link'
import { ComponentProps } from 'react'

export function H1({ children, className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      className={cn(
        'scroll-m-28',
        props.id && 'flex flex-row items-center gap-2',
        className
      )}
      {...props}
    >
      {props.id ? (
        <>
          <NextLink
            href={`#${props.id}`}
            className="peer font-extrabold no-underline hover:opacity-100"
          >
            {children}
          </NextLink>
          <Link
            className="text-fd-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity peer-hover:opacity-100"
            aria-label="Link to section"
          />
        </>
      ) : (
        children
      )}
    </h1>
  )
}

export function H2({ children, className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      className={cn(
        'scroll-m-28',
        props.id && 'flex flex-row items-center gap-2',
        className
      )}
      {...props}
    >
      {props.id ? (
        <>
          <NextLink
            href={`#${props.id}`}
            className="peer font-semibold no-underline hover:opacity-100"
          >
            {children}
          </NextLink>
          <Link
            className="text-fd-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity peer-hover:opacity-100"
            aria-label="Link to section"
          />
        </>
      ) : (
        children
      )}
    </h2>
  )
}

export const Description: React.FC<React.ComponentProps<'p'>> = ({
  children,
  className,
  ...props
}) => (
  <p className={cn('text-muted-foreground text-lg', className)} {...props}>
    {children}
  </p>
)
