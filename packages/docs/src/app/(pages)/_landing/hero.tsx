import { NuqsWordmark } from '@/src/components/logo'
import { buttonVariants } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'
import { ChevronDown, Github, Library } from 'lucide-react'
import Link from 'next/link'
import { LandingDemo } from './demo'

export function HeroSection() {
  return (
    <section className="container relative flex flex-col justify-center gap-8 xl:h-[calc(100vh-4rem)] xl:flex-row">
      <aside className="my-16 flex flex-col items-center self-center xl:my-24 xl:-mr-10 xl:ml-10 xl:flex-1 xl:items-start">
        <h1 className="text-6xl md:text-8xl">
          <NuqsWordmark />
        </h1>
        <p className="my-8 text-center text-2xl md:text-4xl xl:text-left">
          Type-safe search params
          <br />
          state manager for Next.js
        </p>
        <nav className="flex flex-wrap gap-4">
          <Link
            href="/docs"
            className={cn(
              buttonVariants({
                size: 'lg'
              }),
              'text-md w-full rounded-full sm:w-auto'
            )}
          >
            <Library className="mr-2 inline-block" size={20} />
            Documentation
          </Link>
          <a
            href="https://github.com/47ng/nuqs"
            className={cn(
              buttonVariants({
                size: 'lg',
                variant: 'secondary'
              }),
              'text-md w-full rounded-full sm:w-auto'
            )}
          >
            <Github className="-ml-1 mr-2 inline-block" size={20} />
            GitHub
          </a>
        </nav>
      </aside>
      <aside className="my-4 xl:my-8 xl:flex-1">
        <LandingDemo />
      </aside>
      <div
        className="absolute bottom-2 left-0 right-0 hidden h-12 items-center justify-center xl:flex"
        aria-hidden
      >
        <ChevronDown />
      </div>
    </section>
  )
}
