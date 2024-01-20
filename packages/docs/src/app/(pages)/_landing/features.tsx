import {
  BatteryFull,
  BookCheck,
  Feather,
  History,
  Hourglass,
  Link,
  Rainbow,
  SatelliteDish,
  Server,
  Shuffle,
  Sparkles,
  TestTube2
} from 'lucide-react'
import React from 'react'

export function FeaturesSection(props: React.ComponentProps<'section'>) {
  return (
    <section
      className="container relative grid grid-cols-1 gap-x-12 gap-y-16 px-4 py-24 md:grid-cols-2 xl:grid-cols-3 xl:gap-y-24"
      {...props}
    >
      <h2 className="sr-only">Features</h2>
      <Feature
        icon={
          <svg
            fill="none"
            width="1.2em"
            height="1.2em"
            viewBox="0 0 128 128"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect fill="currentColor" height="128" rx="6" width="128" />
            <path
              clipRule="evenodd"
              d="m74.2622 99.468v14.026c2.2724 1.168 4.9598 2.045 8.0625 2.629 3.1027.585 6.3728.877 9.8105.877 3.3503 0 6.533-.321 9.5478-.964 3.016-.643 5.659-1.702 7.932-3.178 2.272-1.476 4.071-3.404 5.397-5.786 1.325-2.381 1.988-5.325 1.988-8.8313 0-2.5421-.379-4.7701-1.136-6.6841-.758-1.9139-1.85-3.6159-3.278-5.1062-1.427-1.4902-3.139-2.827-5.134-4.0104-1.996-1.1834-4.246-2.3011-6.752-3.353-1.8352-.7597-3.4812-1.4975-4.9378-2.2134-1.4567-.7159-2.6948-1.4464-3.7144-2.1915-1.0197-.7452-1.8063-1.5341-2.3598-2.3669-.5535-.8327-.8303-1.7751-.8303-2.827 0-.9643.2476-1.8336.7429-2.6079s1.1945-1.4391 2.0976-1.9943c.9031-.5551 2.0101-.9861 3.3211-1.2929 1.311-.3069 2.7676-.4603 4.3699-.4603 1.1658 0 2.3958.0877 3.6928.263 1.296.1753 2.6.4456 3.911.8109 1.311.3652 2.585.8254 3.824 1.3806 1.238.5552 2.381 1.198 3.43 1.9285v-13.1051c-2.127-.8182-4.45-1.4245-6.97-1.819s-5.411-.5917-8.6744-.5917c-3.3211 0-6.4674.3579-9.439 1.0738-2.9715.7159-5.5862 1.8336-7.844 3.353-2.2578 1.5195-4.0422 3.4553-5.3531 5.8075-1.311 2.3522-1.9665 5.1646-1.9665 8.4373 0 4.1785 1.2017 7.7433 3.6052 10.6945 2.4035 2.9513 6.0523 5.4496 10.9466 7.495 1.9228.7889 3.7145 1.5633 5.375 2.323 1.6606.7597 3.0954 1.5486 4.3044 2.3668s2.1628 1.7094 2.8618 2.6736c.7.9643 1.049 2.06 1.049 3.2873 0 .9062-.218 1.7462-.655 2.5202s-1.1 1.446-1.9885 2.016c-.8886.57-1.9956 1.016-3.3212 1.337-1.3255.321-2.8768.482-4.6539.482-3.0299 0-6.0305-.533-9.0021-1.6-2.9715-1.066-5.7245-2.666-8.2591-4.799zm-23.5596-34.9136h18.2974v-11.5544h-51v11.5544h18.2079v51.4456h14.4947z"
              className="fill-background"
              fillRule="evenodd"
            />
          </svg>
        }
        title="Type-safe"
        description="End-to-end type safety between Server and Client components."
      />
      <Feature
        icon={<Shuffle size={32} />}
        title="Universal"
        description="Supports both the app router and pages router."
      />
      <Feature
        icon={<BookCheck size={32} />}
        title="Simple"
        description={
          <>
            A familiar <code>React.useState</code>-like API, that syncs with the
            URL.
          </>
        }
      />
      <Feature
        icon={<BatteryFull size={32} />}
        title="Batteries included"
        description="Built-in parsers for common state types."
      />
      <Feature
        icon={<History size={32} />}
        title="History controls"
        description="Replace or append to navigation history and use the Back button to navigate state updates."
      />
      <Feature
        icon={<Link size={32} />}
        title="Related queries"
        description={
          <>
            <code>useQueryStates</code> hook to manage multiple keys at once.
          </>
        }
      />
      <Feature
        icon={<SatelliteDish size={32} />}
        title="Client-first"
        description="Shallow updates by default, opt-in to notify the server to re-render RSCs (with throttle control)."
      />
      <Feature
        icon={<Server size={32} />}
        title="Server cache"
        description="Type-safe search params access in nested React Server Components."
        isNew
      />
      <Feature
        icon={<Hourglass size={32} />}
        title="Transition"
        description="Support for useTransition to get loading states on server updates."
        isNew
      />
      <Feature
        icon={<Rainbow size={32} />}
        title="Customizable"
        description="Make your own parser and serializer."
      />
      <Feature
        icon={<Feather size={32} />}
        title="Tiny"
        description="Only 3.5kb gzipped."
      />
      <Feature
        icon={<TestTube2 size={32} />}
        title="Tested"
        description="Tested against every Next.js release."
      />
    </section>
  )
}

// --

type FeatureProps = {
  title: React.ReactNode
  description: React.ReactNode
  icon: React.ReactNode
  isNew?: boolean
}

export function Feature({ title, description, icon, isNew }: FeatureProps) {
  // https://v0.dev/t/xXdcvuFkW1d
  return (
    <>
      <div className="space-y-4 xl:space-y-8">
        <div className="flex items-center gap-2">
          <span
            className="text-3xl text-zinc-500"
            aria-hidden
            role="presentation"
          >
            {icon}
          </span>
          <h3 className="text-2xl font-bold tracking-tighter dark:text-white md:text-3xl xl:text-4xl">
            {title}
            {isNew && (
              <Sparkles
                className="ml-2 inline-block -translate-y-3 text-amber-500 dark:text-amber-300"
                aria-label="New feature"
              />
            )}
          </h3>
        </div>
        <p className="text-zinc-500 dark:text-zinc-300 md:text-lg/relaxed xl:text-xl/relaxed">
          {description}
        </p>
      </div>
    </>
  )
}
