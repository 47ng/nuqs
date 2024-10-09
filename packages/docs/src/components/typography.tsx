import { twMerge } from 'tailwind-merge'

// todo: See if this is still used

export const H1: React.FC<React.ComponentProps<'h1'>> = ({
  children,
  className,
  ...props
}) => (
  <h1
    className={twMerge(
      'mb-4 text-3xl font-bold text-foreground sm:text-4xl',
      className
    )}
    {...props}
  >
    {children}
  </h1>
)

export const Description: React.FC<React.ComponentProps<'p'>> = ({
  children,
  className,
  ...props
}) => (
  <p className={twMerge('text-lg text-muted-foreground', className)} {...props}>
    {children}
  </p>
)
