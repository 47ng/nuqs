import { cn } from '@/src/lib/utils'

export function ResponsiveHelper() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  return (
    <aside
      className="
      pointer-events-none fixed bottom-4 right-4 flex select-none gap-2
      rounded border bg-background px-2 py-1 font-mono text-xs shadow-xl
      "
    >
      <span className="opacity-25 sm:opacity-100">sm</span>
      <span className="opacity-25 md:opacity-100">md</span>
      <span className="opacity-25 lg:opacity-100">lg</span>
      <span className="opacity-25 xl:opacity-100">xl</span>
    </aside>
  )
}

const cqcn = (size: string) =>
  cn(
    'absolute inset-0 hidden pointer-events-none bg-background rounded-lg items-center justify-center',
    size
  )

export function ContainerQueryHelper() {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <aside
      className="
      pointer-events-none absolute left-0 top-0 h-6 w-10 select-none
      rounded border bg-background font-mono text-xs shadow-xl
      "
    >
      <span className={cqcn('flex')}>base</span>
      <span className={cqcn('@xs:flex')}>@xs</span>
      <span className={cqcn('@sm:flex')}>@sm</span>
      <span className={cqcn('@md:flex')}>@md</span>
      <span className={cqcn('@lg:flex')}>@lg</span>
      <span className={cqcn('@xl:flex')}>@xl</span>
      <span className={cqcn('@2xl:flex')}>@2xl</span>
      <span className={cqcn('@3xl:flex')}>@3xl</span>
      <span className={cqcn('@4xl:flex')}>@4xl</span>
      <span className={cqcn('@5xl:flex')}>@5xl</span>
    </aside>
  )
}
