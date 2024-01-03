import { NuqsWordmark } from '@/src/components/logo'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { LandingDemo } from './demo'

export function HeroSection() {
  return (
    <section className="container relative flex flex-col justify-center gap-8 xl:h-[calc(100vh-4rem)] xl:flex-row">
      <aside className="my-24 flex flex-1 flex-col items-center self-center xl:-mr-12 xl:ml-12 xl:items-start">
        <h1 className="text-6xl md:text-8xl">
          <NuqsWordmark />
        </h1>
        <p className="my-8 text-center text-2xl md:text-4xl xl:text-left">
          Type-safe search params state management for Next.js
        </p>
        <Link
          href="/docs"
          className="inline-flex h-12 items-center rounded-full bg-indigo-500 px-6 text-white dark:bg-indigo-600"
        >
          Documentation
        </Link>
      </aside>
      <aside className="my-8 flex-1">
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
