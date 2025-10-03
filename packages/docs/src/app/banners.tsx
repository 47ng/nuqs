import { Banner } from 'fumadocs-ui/components/banner'
import Link from 'next/link'
import { Suspense } from 'react'
import { Countdown } from '../components/countdown'
import { ReactParisLogo } from '../components/react-paris'

// Note: top-level banners go into src/app/layout.tsx
// Note: sidebar banners go into src/app/docs/layout.tsx & playground/layout.tsx

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

export function ReactParis2025SideBanner() {
  return (
    <div className="my-2 flex flex-col items-center gap-1.5 rounded-lg border border-gray-500/40 bg-gray-100/50 px-2 py-4 dark:bg-gray-700/10">
      <p className="text-muted-foreground">🗣️ nuqs will be featured at</p>
      <div className="flex gap-2">
        <ReactParisLogo className="h-12" />
        <p className="mr-1">
          <span className="text-lg font-bold uppercase text-[#002654] dark:text-[#00acff]">
            React
          </span>{' '}
          <span className="text-lg uppercase text-[#cd1126] dark:text-[#fe6497]">
            Paris
          </span>{' '}
          <span className="text-lg">'25</span>
          <br />
          <a
            href="https://react.paris/#tickets"
            className="text-sm hover:underline"
          >
            Get your ticket now!
          </a>
        </p>
      </div>
      <Suspense>
        <Countdown
          targetDate={new Date('2025-03-20T15:00:00+01:00')}
          className="my-2"
        />
      </Suspense>
      <p className="text-center text-xs text-muted-foreground">
        Use the code <code>Francois_Paris</code> for a 20% discount on your
        ticket.
      </p>
    </div>
  )
}

export function NextJSConf2025TopBanner() {
  return (
    <Banner
      variant="primary"
      className="text-md flex flex-wrap items-center justify-center gap-3 font-semibold"
      id="nextjs-conf-2025"
    >
      <span aria-hidden>📺</span>
      <Link
        href="https://nextjs.org/conf"
        className="decoration-slice decoration-1 transition-all hover:underline hover:underline-offset-8 focus-visible:underline focus-visible:outline-none"
        prefetch={false}
      >
        Watch nuqs at Next.js Conf (Oct 22, 1:55pm PT)
      </Link>
      <span aria-hidden>·</span>
      <Suspense>
        <Countdown
          targetDate={new Date('2025-10-22T13:55:00-07:00')}
          expiredMessage={
            <span>
              Live now —{' '}
              <Link
                href="https://nextjs.org/conf"
                className="underline"
                prefetch={false}
              >
                join the livestream
              </Link>
            </span>
          }
        />
      </Suspense>
    </Banner>
  )
}

export function NextJSConf2025SideBanner() {
  return (
    <div className="my-2 flex flex-col items-center gap-1.5 rounded-lg border border-gray-500/40 bg-gray-100/50 px-2 py-4 dark:bg-gray-700/10">
      <p className="text-muted-foreground">🎤 nuqs at Next.js Conf</p>
      <a
        href="https://nextjs.org/conf"
        className="text-sm hover:underline"
      >
        Livestream link
      </a>
      <Suspense>
        <Countdown
          targetDate={new Date('2025-10-22T13:55:00-07:00')}
          className="my-2"
          expiredMessage={<span className="text-sm">Live now!</span>}
        />
      </Suspense>
    </div>
  )
}