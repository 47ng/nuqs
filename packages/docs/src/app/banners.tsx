import { Banner } from 'fumadocs-ui/components/banner'
import Link from 'next/link'

export function NuqsV2AnnouncementTopBanner() {
  return (
    <Banner
      variant="rainbow"
      className="text-md gap-4 font-semibold"
      id="nuqs-2-announcement"
    >
      <span aria-hidden>🎉</span>
      <Link
        href="/blog/nuqs-2"
        className="decoration-slice decoration-1 transition-all hover:underline hover:underline-offset-8 focus-visible:underline focus-visible:outline-none"
        prefetch={false}
      >
        Announcing nuqs version 2
      </Link>
      <span aria-hidden>🎉</span>
    </Banner>
  )
}

export function NuqsV2AnnouncementSidebarBanner() {
  return (
    <div className="my-2 flex justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-100/50 py-2.5 font-semibold dark:bg-blue-700/10">
      <span aria-hidden>🎉</span>
      <Link
        href="/blog/nuqs-2"
        className="text-blue-900 hover:underline focus-visible:underline focus-visible:outline-none dark:text-blue-100"
        prefetch={false}
      >
        Announcing nuqs v2 !
      </Link>
      <span aria-hidden>🎉</span>
    </div>
  )
}
