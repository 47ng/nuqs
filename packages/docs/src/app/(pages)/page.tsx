import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { NuqsWordmark } from '../../components/logo'

export const metadata = {
  title: {
    absolute: 'nuqs | Type-safe search params state management for Next.js'
  }
}

export default function HomePage() {
  return (
    <main>
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
      <section className="container relative grid grid-cols-1 gap-x-12 gap-y-24 px-4 py-24 md:grid-cols-2 xl:grid-cols-3">
        <h2 className="sr-only">Features</h2>
        <Feature
          icon={
            <svg
              width="1.15em"
              height="1.15em"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
              role="presentation"
            >
              <title>TypeScript logo</title>
              <rect
                x="2"
                y="2"
                width="28"
                height="28"
                rx="1.312"
                fill="#3178c6"
              />
              <path
                d="M18.245,23.759v3.068a6.492,6.492,0,0,0,1.764.575,11.56,11.56,0,0,0,2.146.192,9.968,9.968,0,0,0,2.088-.211,5.11,5.11,0,0,0,1.735-.7,3.542,3.542,0,0,0,1.181-1.266,4.469,4.469,0,0,0,.186-3.394,3.409,3.409,0,0,0-.717-1.117,5.236,5.236,0,0,0-1.123-.877,12.027,12.027,0,0,0-1.477-.734q-.6-.249-1.08-.484a5.5,5.5,0,0,1-.813-.479,2.089,2.089,0,0,1-.516-.518,1.091,1.091,0,0,1-.181-.618,1.039,1.039,0,0,1,.162-.571,1.4,1.4,0,0,1,.459-.436,2.439,2.439,0,0,1,.726-.283,4.211,4.211,0,0,1,.956-.1,5.942,5.942,0,0,1,.808.058,6.292,6.292,0,0,1,.856.177,5.994,5.994,0,0,1,.836.3,4.657,4.657,0,0,1,.751.422V13.9a7.509,7.509,0,0,0-1.525-.4,12.426,12.426,0,0,0-1.9-.129,8.767,8.767,0,0,0-2.064.235,5.239,5.239,0,0,0-1.716.733,3.655,3.655,0,0,0-1.171,1.271,3.731,3.731,0,0,0-.431,1.845,3.588,3.588,0,0,0,.789,2.34,6,6,0,0,0,2.395,1.639q.63.26,1.175.509a6.458,6.458,0,0,1,.942.517,2.463,2.463,0,0,1,.626.585,1.2,1.2,0,0,1,.23.719,1.1,1.1,0,0,1-.144.552,1.269,1.269,0,0,1-.435.441,2.381,2.381,0,0,1-.726.292,4.377,4.377,0,0,1-1.018.105,5.773,5.773,0,0,1-1.969-.35A5.874,5.874,0,0,1,18.245,23.759Zm-5.154-7.638h4V13.594H5.938v2.527H9.92V27.375h3.171Z"
                fill="#fff"
                fillRule="evenodd"
              />
            </svg>
          }
          title="Type-safe"
          description="End-to-end type safety between Server and Client components."
        />
        <Feature
          icon="🔀"
          title="Universal"
          description="Supports both the app router and pages router."
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
          description={
            <>
              <code>useQueryStates</code> hook to manage multiple keys at once.
            </>
          }
        />
        <Feature
          icon="📡"
          title="Client-first"
          description="Shallow updates by default, opt-in to notify the server."
        />
        <Feature
          icon="🗃"
          title="Server cache"
          description="Type-safe search params access in nested React Server Components."
          isNew
        />
        <Feature
          icon="⌛️"
          title="Transition"
          description="Support for useTransition to get loading states on server updates."
          isNew
        />
        <Feature
          icon="🌈"
          title="Customizable"
          description="Make your own parser and serializer."
        />
        <Feature icon="🪶" title="Tiny" description="Only 3.5kb gzipped." />
        <Feature
          icon="🧪"
          title="Tested"
          description="Tested against every Next.js release."
        />
      </section>
    </main>
  )
}

type FeatureProps = {
  title: React.ReactNode
  description: React.ReactNode
  icon: React.ReactNode
  isNew?: boolean
}

function Feature({ title, description, icon, isNew }: FeatureProps) {
  // https://v0.dev/t/xXdcvuFkW1d
  return (
    <>
      <div className="space-y-4 xl:space-y-8">
        <div className="flex items-center gap-2">
          <span className="text-3xl" aria-hidden role="presentation">
            {icon}
          </span>
          <h3 className="text-2xl font-bold tracking-tighter dark:text-white md:text-3xl xl:text-4xl">
            {title}
            {isNew && (
              <sup className="ml-2" aria-label="New feature">
                ✨
              </sup>
            )}
          </h3>
        </div>
        <p className="text-gray-500 dark:text-gray-300 md:text-lg/relaxed xl:text-xl/relaxed">
          {description}
        </p>
      </div>
    </>
  )
}
