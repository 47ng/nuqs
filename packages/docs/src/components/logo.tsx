import Image from 'next/image'
import Wordmark from 'res/wordmark.svg'
import { cn } from 'src/lib/utils'

export function NuqsWordmark({ className }: React.ComponentProps<'img'>) {
  return (
    <>
      <Image
        src={Wordmark}
        role="presentation"
        alt="nuqs"
        className={cn('h-[1em] w-auto', className)}
      />
      <span className="sr-only">nuqs</span>
    </>
  )
}
