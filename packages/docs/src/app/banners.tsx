import { Banner } from 'fumadocs-ui/components/banner'
import { PlayIcon } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { Countdown } from '../components/countdown'
import { ReactParisLogo } from '../components/react-paris'
import { cn } from '../lib/utils'

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
          <span className="text-lg font-bold text-[#002654] uppercase dark:text-[#00acff]">
            React
          </span>{' '}
          <span className="text-lg text-[#cd1126] uppercase dark:text-[#fe6497]">
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
      <p className="text-muted-foreground text-center text-xs">
        Use the code <code>Francois_Paris</code> for a 20% discount on your
        ticket.
      </p>
    </div>
  )
}

const NEXTJS_CONF_2025_TALK_TIME = new Date('2025-10-22T13:55:00-07:00')

export function NextJSConf2025WideBanner({
  className
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'dark:border-b-border flex min-h-11 flex-col items-center justify-center gap-2 border-b border-transparent bg-zinc-50 p-2 shadow-md sm:flex-row sm:gap-4 dark:bg-zinc-900/50',
        className
      )}
    >
      <p className="text-sm sm:text-base">
        Watch nuqs at <NextJSConf2025Logo />
      </p>
      <span
        aria-hidden
        className="text-muted-foreground hidden text-xs sm:block"
      >
        •
      </span>
      <a
        href="https://nextjs.org/conf"
        className="-ml-1.5 text-sm hover:underline sm:text-base"
      >
        <PlayIcon className="mr-1 mb-[2px] inline-block size-4 fill-current stroke-none" />{' '}
        Livestream
      </a>
      <span
        aria-hidden
        className="text-muted-foreground hidden text-xs sm:block"
      >
        •
      </span>
      <Suspense
        fallback={
          <div className="h-6 w-[150px] animate-pulse rounded-md bg-zinc-500/20" />
        }
      >
        <Countdown
          targetDate={NEXTJS_CONF_2025_TALK_TIME}
          className="min-w-[150px] text-lg"
          expiredMessage={
            <span className="flex items-center gap-2 font-mono text-sm font-semibold text-red-700 dark:text-red-400">
              <div className="size-4 rounded-full bg-red-500" />
              LIVE
            </span>
          }
        />
      </Suspense>
    </div>
  )
}

export function NextJSConf2025SideBanner({
  className
}: {
  className?: string
}) {
  return (
    <div
      className={cn(
        'mt-2 flex flex-col items-center gap-3 rounded-lg border border-gray-500/40 bg-gray-100/50 px-2 py-3 dark:bg-gray-700/10',
        className
      )}
    >
      <p>
        Watch nuqs at <NextJSConf2025Logo />
      </p>
      <a
        href="https://nextjs.org/conf"
        className="-ml-1.5 text-sm hover:underline"
      >
        <PlayIcon className="mr-1 mb-[2px] inline-block size-4 fill-current stroke-none" />{' '}
        Livestream
      </a>
      <Suspense>
        <Countdown
          targetDate={NEXTJS_CONF_2025_TALK_TIME}
          expiredMessage={
            <span className="flex items-center gap-2 font-mono text-sm font-semibold text-red-700 dark:text-red-400">
              <div className="size-4 rounded-full bg-red-500" />
              LIVE
            </span>
          }
        />
      </Suspense>
    </div>
  )
}

const NextJSConf2025Logo = () => (
  <svg
    viewBox="0 0 144 28"
    className="align-center mb-[1px] ml-0.25 inline-block h-[1em] w-auto"
    fill="none"
    aria-label="Next.js Conf 25"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0 4.00015H4.19672L12.6437 18.9013V4.00015H16.2341V23.8142H11.9264L3.58845 9.3297V23.8142H0V4.00015Z"
      fill="currentColor"
    ></path>
    <path
      d="M25.5595 24.1485C24.1051 24.1485 22.831 23.826 21.7353 23.1851C20.6415 22.5442 19.7994 21.6369 19.2089 20.4652C18.6204 19.2916 18.3252 17.9257 18.3252 16.3614C18.3252 14.8172 18.6204 13.4553 19.2089 12.2736C19.7994 11.092 20.6316 10.1807 21.7075 9.53978C22.7854 8.89687 24.0417 8.5764 25.4762 8.5764C26.8752 8.5764 28.1037 8.89285 29.1618 9.52575C30.2199 10.1586 31.0402 11.0739 31.6188 12.2736C32.1993 13.4733 32.4887 14.9014 32.4887 16.5577V17.3669H21.9968C22.0721 18.6507 22.4208 19.6281 23.047 20.297C23.6731 20.966 24.5192 21.3024 25.5872 21.3024C26.36 21.3024 27.0138 21.1202 27.5469 20.7577C28.0799 20.3952 28.4484 19.8884 28.6506 19.2375L32.2687 19.4598C31.8625 20.9119 31.0659 22.0555 29.879 22.8927C28.6922 23.7299 27.2517 24.1485 25.5595 24.1485ZM28.817 14.9675C28.7437 13.7758 28.4128 12.8825 27.8223 12.2877C27.2338 11.6928 26.4511 11.3944 25.4762 11.3944C24.5192 11.3944 23.7326 11.7028 23.1163 12.3157C22.5001 12.9306 22.1276 13.8138 21.9968 14.9675H28.817Z"
      fill="currentColor"
    ></path>
    <path
      d="M37.8523 16.2231L32.7164 8.91075H36.5545L39.9507 13.9899L43.236 8.91075H47.1573L42.0768 16.2512L47.3217 23.8139H43.5114L39.9785 18.4543L36.4435 23.8139H32.5519L37.8523 16.2231Z"
      fill="currentColor"
    ></path>
    <path
      d="M54.9393 23.8141C53.4671 23.8141 52.3851 23.4697 51.6956 22.7807C51.0041 22.0917 50.6593 21.0142 50.6593 19.5441V11.6749H48.341V8.91103H50.6593V5.42408H54.1942V8.91103H58.0858V11.6749H54.1942V19.2096C54.1942 19.8966 54.3369 20.3753 54.6202 20.6456C54.9056 20.916 55.3712 21.0502 56.0152 21.0502H58.0858V23.8141H54.9393Z"
      fill="currentColor"
    ></path>
    <path
      d="M64.1833 19.9064H60.1249V23.8131H64.1833V19.9064Z"
      fill="currentColor"
    ></path>
    <path
      d="M65.0831 25.2361H66.5474C67.0982 25.2361 67.5084 25.1159 67.7759 24.8736C68.0434 24.6312 68.1761 24.2046 68.1761 23.5897V8.91096H71.7091V23.7019C71.7091 25.2461 71.3643 26.3477 70.6748 27.0086C69.9833 27.6695 68.8201 28 67.1814 28H65.0831V25.2361ZM68.0929 4H71.7646V7.18051H68.0929V4Z"
      fill="currentColor"
    ></path>
    <path
      d="M80.6772 24.1485C78.561 24.1485 76.9124 23.6918 75.7354 22.7805C74.5584 21.8692 73.9124 20.6515 73.8034 19.1254L77.4196 18.9571C77.5484 19.7582 77.8754 20.3671 78.3985 20.7857C78.9236 21.2043 79.6825 21.4126 80.6772 21.4126C82.4447 21.4126 83.3284 20.8558 83.3284 19.7382C83.3284 19.3857 83.2451 19.0973 83.0787 18.873C82.9142 18.6507 82.6012 18.4544 82.1395 18.2882C81.6798 18.1199 80.9982 17.9617 80.0966 17.8135C78.5887 17.5531 77.4058 17.2327 76.5498 16.8501C75.6938 16.4696 75.0815 15.9949 74.713 15.4281C74.3464 14.8593 74.1621 14.1383 74.1621 13.2651C74.1621 11.8511 74.7051 10.7154 75.7909 9.86023C76.8767 9.00502 78.4124 8.5764 80.4018 8.5764C82.3159 8.5764 83.8099 9.03304 84.8878 9.94433C85.9638 10.8556 86.6136 12.0734 86.8336 13.5995L83.2452 13.7678C83.1164 13.0047 82.8033 12.4038 82.3059 11.9672C81.8086 11.5306 81.1646 11.3103 80.374 11.3103C79.5458 11.3103 78.9157 11.4785 78.4817 11.813C78.0498 12.1495 77.8338 12.5941 77.8338 13.1529C77.8338 13.7477 78.0537 14.1904 78.4956 14.4788C78.9374 14.7672 79.7201 15.0035 80.8436 15.1898C82.3892 15.4321 83.6078 15.7446 84.5014 16.1251C85.3931 16.5057 86.0331 16.9803 86.4195 17.5491C86.8059 18.1159 87 18.8269 87 19.6821C87 21.0961 86.4234 22.1937 85.2741 22.9768C84.1229 23.7579 82.5913 24.1485 80.6772 24.1485Z"
      fill="currentColor"
    ></path>
    <path
      d="M140.192 4.75C141.881 4.75004 143.25 6.11896 143.25 7.80762V20.1924C143.25 21.881 141.881 23.25 140.192 23.25H95.8076C94.119 23.25 92.75 21.881 92.75 20.1924V7.80762C92.75 6.11896 94.119 4.75004 95.8076 4.75H140.192Z"
      stroke="currentColor"
      strokeWidth="1.5"
    ></path>
    <path
      d="M103.49 15.4677C103.164 17.3477 102.027 18.5 100.384 18.5C98.2327 18.5 97 16.7655 97 14.0121C97 11.2345 98.2327 9.5 100.384 9.5C101.943 9.5 103.055 10.5795 103.441 12.3747L102.052 12.4596C101.774 11.3315 101.182 10.7372 100.36 10.7372C99.0787 10.7372 98.3777 11.9016 98.3777 14.0121C98.3777 16.1105 99.0787 17.2628 100.36 17.2628C101.254 17.2628 101.858 16.6078 102.1 15.3827L103.49 15.4677Z"
      fill="currentColor"
    ></path>
    <path
      d="M107.842 18.5C105.811 18.5 104.639 16.7291 104.639 14.0121C104.639 11.2709 105.811 9.5 107.842 9.5C109.872 9.5 111.056 11.2709 111.056 14.0121C111.056 16.7291 109.872 18.5 107.842 18.5ZM106.017 14.0121C106.017 16.0377 106.657 17.2628 107.842 17.2628C109.026 17.2628 109.679 16.0377 109.679 14.0121C109.679 11.9623 109.026 10.7372 107.842 10.7372C106.657 10.7372 106.017 11.9623 106.017 14.0121Z"
      fill="currentColor"
    ></path>
    <path
      d="M112.36 9.68761H114.003L116.614 16.2375V9.68761H117.931V18.2995H116.179L113.665 12.0043V18.2995H112.36C112.36 14.9363 112.36 13.0507 112.36 9.68761Z"
      fill="currentColor"
    ></path>
    <path
      d="M119.588 9.68761H124.99V10.9248H120.929V13.472H124.772V14.6849H120.929V18.2995H119.588V9.68761Z"
      fill="currentColor"
    ></path>
    <path
      d="M126.204 12.3383C126.385 10.7008 127.545 9.5 129.31 9.5C130.965 9.5 132.162 10.5795 132.162 12.035C132.162 13.2722 131.219 14.1334 129.998 14.8612C129.37 15.2129 127.787 16.2561 127.69 17.0687H132.21V18.3059H126.046C126.046 15.7345 127.593 14.8127 129.261 13.7695C130.107 13.2358 130.784 12.6779 130.784 12.0229C130.784 11.283 130.18 10.7372 129.31 10.7372C128.367 10.7372 127.751 11.3679 127.581 12.4232L126.204 12.3383Z"
      fill="currentColor"
    ></path>
    <path
      d="M138.541 9.65545V10.8926H134.891L134.589 13.1487C134.976 12.7363 135.616 12.518 136.22 12.518C137.804 12.518 139 13.7552 139 15.4897C139 17.2363 137.743 18.4614 135.955 18.4614C134.359 18.4614 133.066 17.3819 132.945 15.987L134.323 15.9142C134.432 16.7147 135.096 17.2242 136.051 17.2242C136.958 17.2242 137.622 16.5085 137.622 15.4897C137.622 14.4466 136.897 13.7309 135.918 13.7309C135.278 13.7309 134.661 14.0948 134.456 14.5921H133.078L133.755 9.65545H138.541Z"
      fill="currentColor"
    ></path>
  </svg>
)
