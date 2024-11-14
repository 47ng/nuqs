import { Button } from '../components/ui/button'
import PageLayout from './(pages)/layout'

export default function NotFoundPage() {
  return (
    <PageLayout>
      <main className="container relative flex h-[75vh] items-center">
        <NotFoundComponent />
      </main>
    </PageLayout>
  )
}

/**
 * v0 by Vercel.
 * @see https://v0.dev/t/4RlmIQ6YYxD
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import Link from 'next/link'

export function NotFoundComponent() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="relative space-y-2">
            <div className="absolute -top-12 left-0 z-0 flex h-full w-full items-end justify-center">
              <span className="select-none text-9xl font-bold text-zinc-200 opacity-20 dark:text-zinc-800">
                404
              </span>
            </div>
            <h1 className="relative z-10 text-3xl font-bold tracking-tighter sm:text-5xl">
              Page Not Found
            </h1>
            <p className="relative z-10 max-w-[600px] text-zinc-500 dark:text-zinc-400 md:text-xl">
              The page you are looking for does not exist.
            </p>
          </div>
          <Button asChild>
            <Link prefetch={false} href="/">
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
