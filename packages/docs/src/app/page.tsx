import { ChevronDown } from 'lucide-react'
import { Nav } from 'next-docs-ui/nav'
import Link from 'next/link'
import { NuqsWordmark } from '../components/logo'
import { navItems, navLinks } from '../components/nav'

const SHOW_HERO = true

export default function HomePage() {
  return (
    <>
      <Nav
        title={<NuqsWordmark />}
        enableSidebar={false}
        items={navItems}
        links={navLinks}
      />
      <main>
        {SHOW_HERO && (
          <section
            className="relative flex flex-col items-center justify-center"
            style={{
              height: 'calc(100vh - 4rem)'
            }}
          >
            <h1 className="text-6xl md:text-8xl">
              <NuqsWordmark />
            </h1>
            <p className="my-8 text-center text-2xl md:text-4xl">
              Type-safe search params state management for Next.js
            </p>
            <Link
              href="/docs"
              className="flex h-12 items-center rounded-full bg-indigo-500 px-6 text-white dark:bg-indigo-600"
            >
              Documentation
            </Link>
            <div
              className="absolute bottom-2 left-0 right-0 flex h-12 items-center justify-center"
              aria-hidden
            >
              <ChevronDown />
            </div>
          </section>
        )}
        <section className="container grid grid-cols-1 gap-12 py-12 sm:grid-cols-2 md:grid-cols-3">
          <Feature
            icon="🟦"
            title="Type-safe"
            description="TypeScript support out of the box."
          />
          <Feature
            icon="🔀"
            title="Universal"
            description="Supports both the app and pages routers."
          />
          <Feature
            icon="🧘‍♀️"
            title="Simple"
            description="The URL is the source of truth."
          />
          <Feature
            icon="🔋"
            title="Batteries included"
            description="Built-in parsers for common state types."
          />
          <Feature
            icon="🕰"
            title="History controls"
            description="Replace or append to navigation history and use the Back button to navigate state updates."
          />
          <Feature
            icon="♊️"
            title="Related queries"
            description="useQueryStates hook to manage multiple keys at once."
          />
          <Feature
            icon="📡"
            title="Client-first"
            description="Shallow updates by default, opt-in to notify the server."
          />
          <Feature
            icon="🗃"
            title="new: Server cache"
            description="Type-safe search params access in nested React Server Components."
          />
          <Feature
            icon="⌛️"
            title="new: Transition"
            description="Support for useTransition to get loading states on server updates."
          />
          <Feature
            icon="🌈"
            title="Customizable"
            description="Use your own parser and serializer."
          />
          <Feature icon="🪶" title="Tiny" description="Only 3.5kb gzipped." />
          <Feature
            icon="🧪"
            title="Tested"
            description="Tested against every Next.js release."
          />
        </section>
      </main>
    </>
  )
}

function Feature({ title, description, icon }: any) {
  return (
    <div className="flex flex-col items-center">
      <h3 className="mt-4 text-xl font-bold">
        <span className="mr-2">{icon}</span>
        {title}
      </h3>
      <p className="mt-2 text-center">{description}</p>
    </div>
  )
}
