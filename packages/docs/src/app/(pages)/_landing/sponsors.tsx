import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'
import { Heart } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { z } from 'zod'

const sponsorSchema = z.object({
  name: z.string().nullish(),
  handle: z.string(),
  url: z.string().url(),
  img: z.string().url(),
  title: z.custom<ReactNode>().optional()
})
type Sponsors = z.infer<typeof sponsorSchema>[]

const SPONSORS: Sponsors = [
  {
    handle: 'vercel',
    name: 'Vercel',
    url: 'https://vercel.com/',
    img: 'https://avatars.githubusercontent.com/u/14985020?s=200&v=4'
  },
  {
    handle: 'unkey.com',
    name: 'Unkey',
    url: 'https://unkey.com',
    img: 'https://avatars.githubusercontent.com/u/138932600?s=200&v=4'
  },
  {
    handle: 'openstatus.dev',
    name: 'OpenStatus',
    url: 'https://openstatus.dev',
    img: 'https://avatars.githubusercontent.com/u/136892265?s=200&v=4'
  },
  {
    handle: 'databuddy.cc',
    name: 'Databuddy',
    url: 'https://databuddy.cc?utm_source=nuqs',
    img: 'https://avatars.githubusercontent.com/u/190393139?v=4'
  },
  {
    handle: 'code-store-platform',
    name: 'code.store',
    url: 'https://code.store',
    img: 'https://avatars.githubusercontent.com/u/57156815?s=200&v=4'
  },
  {
    handle: 'pqoqubbw',
    name: 'dmytro',
    url: 'https://pqoqubbw.dev/',
    img: 'https://avatars.githubusercontent.com/u/71014515?s=200&v=4'
  },
  {
    handle: 'ryanmagoon',
    name: 'Ryan Magoon',
    url: 'https://x.com/Ryan_Magoon',
    img: 'https://avatars.githubusercontent.com/u/5327290?s=200&v=4'
  },
  {
    handle: 'pontusab',
    name: 'Pontus Abrahamsson',
    url: 'https://x.com/pontusab',
    img: 'https://avatars.githubusercontent.com/u/655158?s=200&v=4',
    title: (
      <>
        Founder of{' '}
        <a href="https://midday.ai" className="hover:underline">
          Midday.ai
        </a>
      </>
    )
  },
  {
    handle: 'CarlLindesvard',
    name: 'Carl Lindesvärd',
    url: 'https://x.com/CarlLindesvard',
    img: 'https://pbs.twimg.com/profile_images/1751607056316944384/8E4F88FL_400x400.jpg',
    title: (
      <>
        Founder of{' '}
        <a href="https://openpanel.dev" className="hover:underline">
          OpenPanel
        </a>
      </>
    )
  },
  {
    handle: 'rwieruch',
    name: 'Robin Wieruch',
    url: 'https://www.robinwieruch.de/',
    img: 'https://avatars.githubusercontent.com/u/2479967?s=200&v=4',
    title: (
      <>
        Author of{' '}
        <a href="https://www.road-to-next.com/" className="hover:underline">
          The Road to Next
        </a>
      </>
    )
  },
  {
    handle: 'aurorascharff',
    name: 'Aurora Scharff',
    url: 'https://aurorascharff.no/',
    img: 'https://avatars.githubusercontent.com/u/66901228?s=200&v=4',
    title: 'Queen of RSCs 👸'
  },
  {
    handle: 'YoannFleuryDev',
    name: 'Yoann Fleury',
    url: 'https://www.yoannfleury.dev/',
    img: 'https://pbs.twimg.com/profile_images/1594632934245498880/CJTKNRCO_400x400.jpg',
    title: 'Front end developer'
  },
  {
    handle: 'dominikkoch',
    name: 'Dominik Koch',
    url: 'https://dominikkoch.dev',
    img: 'https://avatars.githubusercontent.com/u/68947960?s=200&v=4',
    title: (
      <>
        Founder of{' '}
        <a href="https://usenotra.com" className="hover:underline">
          Notra
        </a>
      </>
    )
  },
  {
    handle: 'lpbonomi',
    name: 'Luis Pedro Bonomi',
    url: 'https://github.com/lpbonomi',
    img: 'https://avatars.githubusercontent.com/u/38361000?s=200&v=4'
  },
  {
    handle: 'RhysSullivan',
    name: 'Rhys Sullivan',
    url: 'https://rhys.dev',
    img: 'https://avatars.githubusercontent.com/u/39114868?s=200&v=4'
  },
  {
    handle: 'brandonmcconnell',
    name: 'Brandon McConnell',
    url: 'https://github.com/brandonmcconnell',
    img: 'https://avatars.githubusercontent.com/u/5913254?s=200&v=4'
  },
  {
    handle: 'ruchernchong',
    name: 'Ru Chern Chong',
    url: 'https://github.com/ruchernchong',
    img: 'https://avatars.githubusercontent.com/u/10343662?s=200&v=4'
  },
  {
    handle: 'DavidHDev',
    name: 'David Haz',
    url: 'https://github.com/DavidHDev',
    img: 'https://avatars.githubusercontent.com/u/48634587?s=200&v=4'
  },
  {
    handle: 'basedanarki',
    name: 'anarki',
    url: 'https://github.com/basedanarki',
    img: 'https://avatars.githubusercontent.com/u/161698650?s=200&v=4'
  },
  {
    handle: 'haydenbleasel',
    name: 'Hayden Bleasel',
    url: 'https://www.haydenbleasel.com/',
    img: 'https://avatars.githubusercontent.com/u/4142719?s=200&v=4'
  }
]

export function SponsorsSection() {
  return (
    <section className="mb-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter md:text-4xl xl:text-5xl dark:text-white">
        Sponsors
      </h2>
      <div className="mb-12 flex flex-wrap items-center justify-center gap-8">
        <a
          href="https://sentry.io/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs"
          target="_blank"
          rel="noopener noreferrer"
          className="block p-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 222 66"
            className="h-[28px] w-auto"
            aria-hidden
          >
            <title>Sentry</title>
            <path
              d="M29,2.26a4.67,4.67,0,0,0-8,0L14.42,13.53A32.21,32.21,0,0,1,32.17,40.19H27.55A27.68,27.68,0,0,0,12.09,17.47L6,28a15.92,15.92,0,0,1,9.23,12.17H4.62A.76.76,0,0,1,4,39.06l2.94-5a10.74,10.74,0,0,0-3.36-1.9l-2.91,5a4.54,4.54,0,0,0,1.69,6.24A4.66,4.66,0,0,0,4.62,44H19.15a19.4,19.4,0,0,0-8-17.31l2.31-4A23.87,23.87,0,0,1,23.76,44H36.07a35.88,35.88,0,0,0-16.41-31.8l4.67-8a.77.77,0,0,1,1.05-.27c.53.29,20.29,34.77,20.66,35.17a.76.76,0,0,1-.68,1.13H40.6q.09,1.91,0,3.81h4.78A4.59,4.59,0,0,0,50,39.43a4.49,4.49,0,0,0-.62-2.28Z M124.32,28.28,109.56,9.22h-3.68V34.77h3.73V15.19l15.18,19.58h3.26V9.22h-3.73ZM87.15,23.54h13.23V20.22H87.14V12.53h14.93V9.21H83.34V34.77h18.92V31.45H87.14ZM71.59,20.3h0C66.44,19.06,65,18.08,65,15.7c0-2.14,1.89-3.59,4.71-3.59a12.06,12.06,0,0,1,7.07,2.55l2-2.83a14.1,14.1,0,0,0-9-3c-5.06,0-8.59,3-8.59,7.27,0,4.6,3,6.19,8.46,7.52C74.51,24.74,76,25.78,76,28.11s-2,3.77-5.09,3.77a12.34,12.34,0,0,1-8.3-3.26l-2.25,2.69a15.94,15.94,0,0,0,10.42,3.85c5.48,0,9-2.95,9-7.51C79.75,23.79,77.47,21.72,71.59,20.3ZM195.7,9.22l-7.69,12-7.64-12h-4.46L186,24.67V34.78h3.84V24.55L200,9.22Zm-64.63,3.46h8.37v22.1h3.84V12.68h8.37V9.22H131.08ZM169.41,24.8c3.86-1.07,6-3.77,6-7.63,0-4.91-3.59-8-9.38-8H154.67V34.76h3.8V25.58h6.45l6.48,9.2h4.44l-7-9.82Zm-10.95-2.5V12.6h7.17c3.74,0,5.88,1.77,5.88,4.84s-2.29,4.86-5.84,4.86Z"
              transform="translate(11, 11)"
              fill="currentColor"
            />
          </svg>
          <span className="sr-only">Sentry</span>
        </a>
        <a
          href="https://syntax.fm/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs"
          target="_blank"
          rel="noopener noreferrer"
          className="block p-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1371 1212"
            className="h-[32px] w-auto"
            aria-hidden
          >
            <title>Syntax</title>
            <path
              d="M255.125 590.149C293.973 588.793 328.25 580.303 357.957 564.68C387.663 549.056 410.404 527.329 426.179 499.497C441.953 471.665 449.219 439.944 447.975 404.333C446.675 367.104 436.983 337.055 418.897 314.187C400.812 291.319 379.282 274.244 354.308 262.961C329.334 251.679 298.565 240.733 262 230.125C226.514 219.48 201.053 209.7 185.615 200.785C170.178 191.87 162.167 179.05 161.583 162.324C161.074 147.756 166.619 136.352 178.216 128.114C189.813 119.876 205.593 115.409 225.557 114.711C274.117 113.016 316.128 132.617 351.59 173.516L418.564 95.8166C389.992 66.5623 359.962 45.8673 328.476 33.7315C296.99 21.5958 263.172 16.1591 227.021 17.4215C170.368 19.3999 124.856 34.8997 90.4849 63.9211C56.1142 92.9425 39.7956 132.273 41.529 181.912C42.6784 214.825 51.4441 241.53 67.8261 262.026C84.2081 282.523 103.788 297.91 126.566 308.189C149.344 318.468 177.917 328.41 212.286 338.014C239.566 345.705 260.872 352.524 276.206 358.471C291.54 364.418 303.962 372.087 313.474 381.479C322.986 390.871 328.005 403.12 328.533 418.228C329.211 437.652 322.608 453.549 308.725 465.919C294.841 478.288 275.759 484.897 251.479 485.745C223.961 486.706 197.905 479.242 173.311 463.354C148.716 447.467 126.672 423.386 107.178 391.114L22.1153 461.341C49.0383 505.239 82.5988 538.101 122.797 559.926C162.995 581.752 207.104 591.826 255.125 590.149ZM482.056 719.98C528.998 718.34 566.24 713.528 593.782 705.544C621.324 697.559 643.794 683.539 661.191 663.484C678.588 643.429 693.911 614.262 707.16 575.984L852.655 147.915L725.589 152.352L651.48 443.415L645.815 443.613L552.391 158.4L426.135 162.809L591.584 561.383C584.69 580.531 572.668 595.942 555.518 607.615C538.369 619.289 512.798 625.719 478.806 626.906L482.056 719.98ZM1015.6 557.11L1007.04 311.881C1006.19 287.601 1013.33 267.769 1028.46 252.385C1043.59 237 1063.56 228.875 1088.38 228.008C1110.51 227.236 1127.98 232.703 1140.82 244.409C1153.65 256.116 1160.49 274.109 1161.34 298.39L1170.19 551.712L1288.35 547.586L1278.77 273.22C1277.22 228.977 1262.89 193.688 1235.77 167.354C1208.65 141.02 1173.51 128.607 1130.34 130.114C1101.75 131.113 1076.85 137.52 1055.66 149.334C1034.46 161.149 1017.7 176.185 1005.37 194.443L1001.32 194.584L999.514 142.786L882.16 146.884L896.631 561.265L1015.6 557.11ZM302.156 1194.4L298.934 1102.13L249.564 1103.86C236.615 1104.31 227.194 1101.4 221.303 1095.12C215.412 1088.84 212.202 1078.15 211.674 1063.04L204.581 859.9L290.37 856.904L287.685 780.017L201.896 783.013L196.865 638.951L78.7017 643.077L83.7324 787.139L26.2695 789.146L28.9545 866.033L86.4174 864.026L94.5288 1096.31C95.697 1129.76 105.099 1155.36 122.736 1173.11C140.373 1190.86 164.838 1199.19 196.133 1198.1L302.156 1194.4ZM473.605 1197.32C495.727 1196.55 518.763 1191.02 542.714 1180.73C566.664 1170.44 587.501 1156.07 605.224 1137.63L606.835 1183.76L711.24 1180.11L701.376 897.653C699.737 850.712 681.516 816.234 646.714 794.22C611.911 772.206 566.993 762.16 511.958 764.082C469.872 765.552 434.646 773.94 406.279 789.246C377.912 804.552 354.218 826.043 335.196 853.718L409.986 907.019C423.914 888.165 438.964 874.404 455.138 865.736C471.312 857.068 491.539 852.31 515.819 851.462C543.337 850.501 563.456 854.255 576.177 862.725C588.897 871.194 595.886 885.671 597.141 906.155C585.384 909.807 576.556 912.276 570.659 913.563C523.611 927.631 489.409 938.279 468.053 945.507C446.697 952.735 426.997 960.986 408.954 970.26C358.06 997.967 333.49 1036.91 335.242 1087.09C336.486 1122.7 349.606 1150.33 374.602 1169.99C399.598 1189.64 432.599 1198.76 473.605 1197.32ZM502.898 1107.98C490.488 1108.41 480.119 1105.39 471.79 1098.93C463.461 1092.47 459.08 1083.04 458.647 1070.63C457.969 1051.2 469.572 1035.4 493.456 1023.22C504.059 1017.45 519.369 1011.11 539.385 1004.2C559.402 997.284 579.558 990.503 599.854 983.852L602.398 1056.69C589.455 1072.81 574.358 1085.22 557.105 1093.93C539.852 1102.63 521.783 1107.32 502.898 1107.98ZM882.378 1174.14L960.267 1037.71L1047.48 1168.37L1191.55 1163.34L1039.38 959.589L1177.07 748.959L1033.01 753.99L955.011 887.176L867.908 759.755L723.846 764.786L874.277 965.355L738.316 1179.17L882.378 1174.14Z"
              fill="currentColor"
            />
            <path
              d="M1366.31 1031.2L1370.78 1159.08L1227.52 1164.08L1223.06 1036.21L1366.31 1031.2Z"
              fill="currentColor"
            />
          </svg>
          <span className="sr-only">Syntax</span>
        </a>
        <a
          href="https://nextjsweekly.com?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs"
          target="_blank"
          rel="noopener noreferrer"
          className="block p-2"
        >
          <span
            role="presentation"
            className="bg-foreground mx-auto block h-[25.5px] w-[270px] [mask-image:url('https://nextjsweekly.com/logo.svg')] [mask-size:100%] [mask-position:center] [mask-repeat:no-repeat]"
          />
          <span className="sr-only">Next.js Weekly</span>
        </a>
        <a
          href="https://shadcnstudio.com/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2"
        >
          <svg
            viewBox="0 0 328 329"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="size-8"
            aria-hidden
          >
            <rect
              y="0.5"
              width="328"
              height="328"
              rx="164"
              fill="currentColor"
            />
            <path
              d="M165.018 72.3008V132.771C165.018 152.653 148.9 168.771 129.018 168.771H70.2288"
              strokeWidth="20"
              className="stroke-background"
            />
            <path
              d="M166.627 265.241L166.627 204.771C166.627 184.889 182.744 168.771 202.627 168.771L261.416 168.771"
              strokeWidth="20"
              className="stroke-background"
            />
            <line
              x1="238.136"
              y1="98.8184"
              x2="196.76"
              y2="139.707"
              strokeWidth="20"
              className="stroke-background"
            />
            <line
              x1="135.688"
              y1="200.957"
              x2="94.3128"
              y2="241.845"
              strokeWidth="20"
              className="stroke-background"
            />
            <line
              x1="133.689"
              y1="137.524"
              x2="92.5566"
              y2="96.3914"
              strokeWidth="20"
              className="stroke-background"
            />
            <line
              x1="237.679"
              y1="241.803"
              x2="196.547"
              y2="200.671"
              strokeWidth="20"
              className="stroke-background"
            />
          </svg>
          <span className="mb-px text-3xl font-semibold">shadcn/studio</span>
        </a>
      </div>
      <ul className="container flex flex-wrap justify-center gap-x-4 gap-y-12 md:gap-x-6 lg:gap-x-8">
        {SPONSORS.map(sponsor => (
          <li
            key={sponsor.handle}
            className="flex w-1/2 flex-col items-center md:w-1/3 lg:w-1/6"
          >
            <a
              href={sponsor.url}
              className="flex h-32 w-32 items-center justify-center rounded-full"
            >
              <img
                src={sponsor.img}
                alt={sponsor.name ?? sponsor.handle}
                className="size-32 rounded-full"
                width={128}
                height={128}
              />
            </a>
            <a
              href={sponsor.url}
              className="mt-2 inline-block font-semibold hover:underline"
            >
              {sponsor.name ?? sponsor.handle}
            </a>
            {Boolean(sponsor.title) && (
              <span className="mt-1 inline-block text-sm text-zinc-500">
                {sponsor.title}
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-16 flex justify-center">
        <Button className="text-md mx-auto font-semibold" asChild size="lg">
          <a href="https://github.com/sponsors/franky47">
            <Heart className="mr-2 stroke-pink-500" size={18} /> Sponsor my work
          </a>
        </Button>
      </div>
    </section>
  )
}

// --

export function InlineSponsorsList({
  className,
  ...props
}: ComponentProps<'ul'>) {
  return (
    <ul
      className={cn(
        'flex flex-wrap items-center justify-center gap-2',
        // 'container grid grid-cols-2 gap-y-12 md:grid-cols-3 lg:grid-cols-6',
        className
      )}
      {...props}
    >
      {SPONSORS.map(sponsor => (
        <InlineSponsor key={sponsor.handle} {...sponsor} />
      ))}
      <InlineSponsor
        handle="ajaypatelaj"
        name="Ajay Patel"
        url="https://shadcnstudio.com/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs"
        img="https://avatars.githubusercontent.com/u/749684?s=200&v=4"
      />
    </ul>
  )
}

function InlineSponsor({ url, img, handle, name }: Sponsors[number]) {
  return (
    <li className="flex flex-col items-center">
      <a
        href={url}
        className="size-12 rounded-full transition-transform hover:scale-125"
      >
        <img
          src={img}
          alt={name ?? handle}
          className="mx-auto size-12 rounded-full"
          title={name ?? handle}
          width={48}
          height={48}
        />
      </a>
    </li>
  )
}

// --

export function AsideSponsors() {
  return (
    <aside className="mt-8">
      <a
        href="https://github.com/sponsors/franky47"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground group mb-2 inline-flex items-center gap-2 text-xs"
      >
        <Heart
          className="size-4 fill-transparent stroke-current"
          aria-label="Sponsor my work on GitHub to add your company here"
        />
        <h3 className="group-hover:underline group-active:underline">
          Sponsored by
        </h3>
      </a>
      <ul className="space-y-2">
        <li>
          <SentryAsideSponsor />
        </li>
        <li>
          <SyntaxAsideSponsor />
        </li>
        <li>
          <NextJSWeeklyAsideSponsor />
        </li>
        <li>
          <ShadcnStudioAsideSponsor />
        </li>
      </ul>
    </aside>
  )
}

export function NextJSWeeklyAsideSponsor() {
  return (
    <a
      href="https://nextjsweekly.com?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs"
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <section className="text-muted-foreground space-y-4 rounded-md border border-dashed px-4 py-6 text-center transition-colors group-hover:text-current group-active:text-current">
        <svg
          viewBox="0 0 200 19"
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto w-3/4"
        >
          <title>Next.js Weekly</title>
          <g
            transform="translate(-20.000000, -20.000000)"
            fill="currentColor"
            fillRule="nonzero"
            stroke="none"
            strokeWidth="1"
          >
            <path d="M23.3514572,20 L31.1718922,31.5115414 L31.3273949,31.5115414 L31.3273949,20 L35.1385934,20 L35.1385934,38.3038438 L31.8295335,38.3038438 L23.9595199,26.7851804 L23.8252848,26.7851804 L23.8252848,38.3038438 L20,38.3038438 L20,20 L23.3514572,20 Z M51.3188892,20 L51.3188892,23.1888449 L42.9471514,23.1888449 L42.9471514,27.5503076 L50.6896969,27.5503076 L50.6896969,30.7391525 L42.9471514,30.7391525 L42.9471514,35.1149989 L51.3542433,35.1149989 L51.3542433,38.3038438 L39.1218665,38.3038438 L39.1218665,20 L51.3188892,20 Z M58.7808891,20 L62.4295415,26.2419526 L62.5709579,26.2419526 L66.24074,20 L70.5609821,20 L65.0385628,29.1519219 L70.6881739,38.3038438 L66.2831373,38.3038438 L62.5709579,32.0547692 L62.4295415,32.0547692 L58.7173622,38.3038438 L54.3334551,38.3038438 L59.9971526,29.1519219 L54.4395174,20 L58.7808891,20 Z M87.9857056,20 L87.9857056,23.1888449 L82.4421568,23.1888449 L82.4421568,38.3038438 L78.6594073,38.3038438 L78.6594073,23.1888449 L73.1158585,23.1888449 L73.1158585,20 L87.9857056,20 Z M101.536026,30.035155 C102.111007,30.035155 102.613126,30.1372959 103.042381,30.3415778 C103.471637,30.5458596 103.806435,30.8301539 104.046776,31.1944607 C104.287117,31.5587674 104.410577,31.9800271 104.417158,32.4582398 L104.417158,32.4582398 L102.846432,32.4582398 L102.827355,32.3269509 C102.776986,32.0729665 102.653333,31.8705437 102.456396,31.7196823 C102.226636,31.5436775 101.915807,31.4556751 101.523908,31.4556751 C101.256574,31.4556751 101.030469,31.494827 100.845593,31.573131 C100.660717,31.6514349 100.520105,31.7584251 100.423756,31.8941015 C100.327407,32.0297779 100.278484,32.184309 100.276986,32.3576949 C100.273952,32.5017398 100.304088,32.6275847 100.367395,32.7352296 C100.430701,32.8428745 100.519356,32.9353272 100.633359,33.0125876 C100.747363,33.0898481 100.878764,33.1562335 101.027563,33.211744 C101.176362,33.2672545 101.334737,33.3146522 101.502688,33.3539372 L101.502688,33.3539372 L102.198766,33.5267911 L102.447027,33.590679 C102.690087,33.6595275 102.917541,33.7432574 103.129391,33.8418688 C103.411857,33.9733507 103.656996,34.1348181 103.864806,34.326271 C104.072617,34.5177238 104.233898,34.7430907 104.34865,35.0023715 C104.463402,35.2616523 104.521546,35.5586426 104.523083,35.8933424 C104.521546,36.3846501 104.401494,36.810493 104.162927,37.1708713 C103.924359,37.5312495 103.581246,37.8101728 103.133588,38.0076412 C102.685929,38.2051096 102.146335,38.3038437 101.514806,38.3038437 C100.888832,38.3038437 100.344706,38.2045878 99.8824279,38.0060759 C99.4201495,37.8075641 99.0600129,37.512538 98.8020181,37.1209978 C98.5440233,36.7294575 98.4082086,36.2437562 98.3945739,35.6638936 L98.3945739,35.6638936 L99.980432,35.6638936 L99.9979238,35.8200771 C100.030445,36.021154 100.099763,36.1935594 100.205877,36.3372933 C100.33852,36.5169606 100.515938,36.651839 100.738132,36.7419285 C100.960326,36.8320179 101.213168,36.8770626 101.496659,36.8770626 C101.774593,36.8770626 102.015959,36.8354144 102.220754,36.752118 C102.42555,36.6688216 102.584694,36.5527979 102.698185,36.404047 C102.811676,36.2552961 102.86917,36.0829538 102.870667,35.88702 C102.86917,35.7063091 102.81735,35.5545402 102.715208,35.4317133 C102.613067,35.3088863 102.464386,35.2041264 102.269165,35.1174335 C102.073945,35.0307406 101.835614,34.9520376 101.554173,34.8813247 L101.554173,34.8813247 L100.709788,34.6644593 L100.471106,34.5982091 C99.9292563,34.4334136 99.4929359,34.197137 99.1621448,33.8893791 C98.784098,33.5376558 98.5958429,33.0648039 98.5973798,32.4708233 C98.5958429,31.9842216 98.7220622,31.5585014 98.9760375,31.1936627 C99.2300128,30.828824 99.5788102,30.5445297 100.02243,30.3407798 C100.466049,30.1370299 100.970581,30.035155 101.536026,30.035155 Z M117.000416,20 L120.019864,32.7197694 L120.176476,32.7197694 L123.502194,20 L127.10553,20 L130.431109,32.7412751 L130.58786,32.7412751 L133.607307,20 L137.815813,20 L132.596003,38.3038438 L128.843148,38.3038438 L125.375005,26.3346784 L125.23258,26.3346784 L121.764575,38.3038438 L118.01172,38.3038438 L112.791772,20 L117.000416,20 Z M152.993585,20 L152.993585,23.1888449 L144.56211,23.1888449 L144.56211,27.5503076 L152.359903,27.5503076 L152.359903,30.7391525 L144.56211,30.7391525 L144.56211,35.1149989 L153.029192,35.1149989 L153.029192,38.3038438 L140.709529,38.3038438 L140.709529,20 L152.993585,20 Z M169.182597,20 L169.182597,23.1888449 L160.751121,23.1888449 L160.751121,27.5503076 L168.548915,27.5503076 L168.548915,30.7391525 L160.751121,30.7391525 L160.751121,35.1149989 L169.218203,35.1149989 L169.218203,38.3038438 L156.898541,38.3038438 L156.898541,20 L169.182597,20 Z M176.940133,20 L176.940133,28.072309 L177.175052,28.072309 L183.740948,20 L188.35545,20 L181.597334,28.1938021 L188.440849,38.3038438 L183.826348,38.3038438 L178.834364,30.7820242 L176.940133,33.0986324 L176.940133,38.3038438 L173.087552,38.3038438 L173.087552,20 L176.940133,20 Z M195.058986,20 L195.058986,35.1149989 L202.870966,35.1149989 L202.870966,38.3038438 L191.206405,38.3038438 L191.206405,20 L195.058986,20 Z M207.188803,20 L211.347654,27.8793166 L211.518592,27.8793166 L215.677443,20 L220,20 L213.348704,31.833149 L213.348704,38.3038438 L209.517542,38.3038438 L209.517542,31.833149 L202.866246,20 L207.188803,20 Z M96.5857574,30.1451529 L96.5857574,35.755047 L96.5783288,35.9735177 C96.5498982,36.402007 96.4400262,36.7797841 96.248713,37.106849 C96.0255142,37.4884248 95.7158081,37.7827961 95.3195948,37.989963 C94.9233815,38.1971298 94.4637532,38.3007132 93.9407098,38.3007132 C93.4731115,38.3007132 93.0499145,38.214675 92.6711189,38.0425987 C92.2923233,37.8705223 91.9917005,37.6088885 91.7692504,37.2576972 C91.5468003,36.9065059 91.4363437,36.4632405 91.4378648,35.9279009 L91.4378648,35.9279009 L93.069076,35.9279009 L93.0794978,36.08126 C93.0969426,36.228874 93.1354564,36.359253 93.1950391,36.4723967 C93.2744827,36.6232551 93.384693,36.7383683 93.52567,36.8177362 C93.666647,36.8971041 93.8322235,36.9367881 94.0223996,36.9367881 C94.2241613,36.9367881 94.3950281,36.8919991 94.5350002,36.8024212 C94.6749724,36.7128433 94.7815277,36.5801849 94.8546663,36.404446 C94.9278049,36.2287071 94.9651426,36.0122408 94.9666795,35.755047 L94.9666795,35.755047 L94.9666795,30.1451529 L96.5857574,30.1451529 Z M88.8936526,36.4150345 C89.1347419,36.4150345 89.3459513,36.5064437 89.5272806,36.6892621 C89.7086099,36.8720804 89.800043,37.0918205 89.8015798,37.3484823 C89.800043,37.5223592 89.7570307,37.6806654 89.672543,37.8234008 C89.5880554,37.9661362 89.477717,38.0797966 89.3415279,38.1643821 C89.2053388,38.2489676 89.056047,38.2912603 88.8936526,38.2912603 C88.6434603,38.2912603 88.4292068,38.1994726 88.2508921,38.0158972 C88.0725773,37.8323218 87.9841884,37.6098502 87.9857253,37.3484823 C87.9841884,37.0918205 88.0725773,36.8720804 88.2508921,36.6892621 C88.4292068,36.5064437 88.6434603,36.4150345 88.8936526,36.4150345 Z" />
          </g>
        </svg>
        <p className="text-sm">Stay up to date on Next.js</p>
        <p className="text-muted-foreground text-xs">
          A weekly newsletter to keep up with what's happening in the ecosystem.
        </p>
      </section>
    </a>
  )
}

export function SentryAsideSponsor() {
  return (
    <a
      href="https://sentry.io/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs"
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <section className="text-muted-foreground space-y-4 rounded-md border border-dashed px-4 py-6 text-center transition-colors group-hover:text-current group-active:text-current">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 222 66"
          className="mx-auto w-1/2"
          aria-hidden
        >
          <title>Sentry</title>
          <path
            d="M29,2.26a4.67,4.67,0,0,0-8,0L14.42,13.53A32.21,32.21,0,0,1,32.17,40.19H27.55A27.68,27.68,0,0,0,12.09,17.47L6,28a15.92,15.92,0,0,1,9.23,12.17H4.62A.76.76,0,0,1,4,39.06l2.94-5a10.74,10.74,0,0,0-3.36-1.9l-2.91,5a4.54,4.54,0,0,0,1.69,6.24A4.66,4.66,0,0,0,4.62,44H19.15a19.4,19.4,0,0,0-8-17.31l2.31-4A23.87,23.87,0,0,1,23.76,44H36.07a35.88,35.88,0,0,0-16.41-31.8l4.67-8a.77.77,0,0,1,1.05-.27c.53.29,20.29,34.77,20.66,35.17a.76.76,0,0,1-.68,1.13H40.6q.09,1.91,0,3.81h4.78A4.59,4.59,0,0,0,50,39.43a4.49,4.49,0,0,0-.62-2.28Z M124.32,28.28,109.56,9.22h-3.68V34.77h3.73V15.19l15.18,19.58h3.26V9.22h-3.73ZM87.15,23.54h13.23V20.22H87.14V12.53h14.93V9.21H83.34V34.77h18.92V31.45H87.14ZM71.59,20.3h0C66.44,19.06,65,18.08,65,15.7c0-2.14,1.89-3.59,4.71-3.59a12.06,12.06,0,0,1,7.07,2.55l2-2.83a14.1,14.1,0,0,0-9-3c-5.06,0-8.59,3-8.59,7.27,0,4.6,3,6.19,8.46,7.52C74.51,24.74,76,25.78,76,28.11s-2,3.77-5.09,3.77a12.34,12.34,0,0,1-8.3-3.26l-2.25,2.69a15.94,15.94,0,0,0,10.42,3.85c5.48,0,9-2.95,9-7.51C79.75,23.79,77.47,21.72,71.59,20.3ZM195.7,9.22l-7.69,12-7.64-12h-4.46L186,24.67V34.78h3.84V24.55L200,9.22Zm-64.63,3.46h8.37v22.1h3.84V12.68h8.37V9.22H131.08ZM169.41,24.8c3.86-1.07,6-3.77,6-7.63,0-4.91-3.59-8-9.38-8H154.67V34.76h3.8V25.58h6.45l6.48,9.2h4.44l-7-9.82Zm-10.95-2.5V12.6h7.17c3.74,0,5.88,1.77,5.88,4.84s-2.29,4.86-5.84,4.86Z"
            transform="translate(11, 11)"
            fill="currentColor"
          />
        </svg>
        <p className="text-sm">Application monitoring for developers</p>
        <p className="text-muted-foreground text-xs">
          See what's slow, fix what's broken, and optimize your code performance.
        </p>
      </section>
    </a>
  )
}

export function SyntaxAsideSponsor() {
  return (
    <a
      href="https://syntax.fm/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs"
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <section className="text-muted-foreground space-y-4 rounded-md border border-dashed px-4 py-6 text-center transition-colors group-hover:text-current group-active:text-current">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1371 1212"
          className="mx-auto h-8"
          aria-hidden
        >
          <title>Syntax</title>
          <path
            d="M255.125 590.149C293.973 588.793 328.25 580.303 357.957 564.68C387.663 549.056 410.404 527.329 426.179 499.497C441.953 471.665 449.219 439.944 447.975 404.333C446.675 367.104 436.983 337.055 418.897 314.187C400.812 291.319 379.282 274.244 354.308 262.961C329.334 251.679 298.565 240.733 262 230.125C226.514 219.48 201.053 209.7 185.615 200.785C170.178 191.87 162.167 179.05 161.583 162.324C161.074 147.756 166.619 136.352 178.216 128.114C189.813 119.876 205.593 115.409 225.557 114.711C274.117 113.016 316.128 132.617 351.59 173.516L418.564 95.8166C389.992 66.5623 359.962 45.8673 328.476 33.7315C296.99 21.5958 263.172 16.1591 227.021 17.4215C170.368 19.3999 124.856 34.8997 90.4849 63.9211C56.1142 92.9425 39.7956 132.273 41.529 181.912C42.6784 214.825 51.4441 241.53 67.8261 262.026C84.2081 282.523 103.788 297.91 126.566 308.189C149.344 318.468 177.917 328.41 212.286 338.014C239.566 345.705 260.872 352.524 276.206 358.471C291.54 364.418 303.962 372.087 313.474 381.479C322.986 390.871 328.005 403.12 328.533 418.228C329.211 437.652 322.608 453.549 308.725 465.919C294.841 478.288 275.759 484.897 251.479 485.745C223.961 486.706 197.905 479.242 173.311 463.354C148.716 447.467 126.672 423.386 107.178 391.114L22.1153 461.341C49.0383 505.239 82.5988 538.101 122.797 559.926C162.995 581.752 207.104 591.826 255.125 590.149ZM482.056 719.98C528.998 718.34 566.24 713.528 593.782 705.544C621.324 697.559 643.794 683.539 661.191 663.484C678.588 643.429 693.911 614.262 707.16 575.984L852.655 147.915L725.589 152.352L651.48 443.415L645.815 443.613L552.391 158.4L426.135 162.809L591.584 561.383C584.69 580.531 572.668 595.942 555.518 607.615C538.369 619.289 512.798 625.719 478.806 626.906L482.056 719.98ZM1015.6 557.11L1007.04 311.881C1006.19 287.601 1013.33 267.769 1028.46 252.385C1043.59 237 1063.56 228.875 1088.38 228.008C1110.51 227.236 1127.98 232.703 1140.82 244.409C1153.65 256.116 1160.49 274.109 1161.34 298.39L1170.19 551.712L1288.35 547.586L1278.77 273.22C1277.22 228.977 1262.89 193.688 1235.77 167.354C1208.65 141.02 1173.51 128.607 1130.34 130.114C1101.75 131.113 1076.85 137.52 1055.66 149.334C1034.46 161.149 1017.7 176.185 1005.37 194.443L1001.32 194.584L999.514 142.786L882.16 146.884L896.631 561.265L1015.6 557.11ZM302.156 1194.4L298.934 1102.13L249.564 1103.86C236.615 1104.31 227.194 1101.4 221.303 1095.12C215.412 1088.84 212.202 1078.15 211.674 1063.04L204.581 859.9L290.37 856.904L287.685 780.017L201.896 783.013L196.865 638.951L78.7017 643.077L83.7324 787.139L26.2695 789.146L28.9545 866.033L86.4174 864.026L94.5288 1096.31C95.697 1129.76 105.099 1155.36 122.736 1173.11C140.373 1190.86 164.838 1199.19 196.133 1198.1L302.156 1194.4ZM473.605 1197.32C495.727 1196.55 518.763 1191.02 542.714 1180.73C566.664 1170.44 587.501 1156.07 605.224 1137.63L606.835 1183.76L711.24 1180.11L701.376 897.653C699.737 850.712 681.516 816.234 646.714 794.22C611.911 772.206 566.993 762.16 511.958 764.082C469.872 765.552 434.646 773.94 406.279 789.246C377.912 804.552 354.218 826.043 335.196 853.718L409.986 907.019C423.914 888.165 438.964 874.404 455.138 865.736C471.312 857.068 491.539 852.31 515.819 851.462C543.337 850.501 563.456 854.255 576.177 862.725C588.897 871.194 595.886 885.671 597.141 906.155C585.384 909.807 576.556 912.276 570.659 913.563C523.611 927.631 489.409 938.279 468.053 945.507C446.697 952.735 426.997 960.986 408.954 970.26C358.06 997.967 333.49 1036.91 335.242 1087.09C336.486 1122.7 349.606 1150.33 374.602 1169.99C399.598 1189.64 432.599 1198.76 473.605 1197.32ZM502.898 1107.98C490.488 1108.41 480.119 1105.39 471.79 1098.93C463.461 1092.47 459.08 1083.04 458.647 1070.63C457.969 1051.2 469.572 1035.4 493.456 1023.22C504.059 1017.45 519.369 1011.11 539.385 1004.2C559.402 997.284 579.558 990.503 599.854 983.852L602.398 1056.69C589.455 1072.81 574.358 1085.22 557.105 1093.93C539.852 1102.63 521.783 1107.32 502.898 1107.98ZM882.378 1174.14L960.267 1037.71L1047.48 1168.37L1191.55 1163.34L1039.38 959.589L1177.07 748.959L1033.01 753.99L955.011 887.176L867.908 759.755L723.846 764.786L874.277 965.355L738.316 1179.17L882.378 1174.14Z"
            fill="currentColor"
          />
          <path
            d="M1366.31 1031.2L1370.78 1159.08L1227.52 1164.08L1223.06 1036.21L1366.31 1031.2Z"
            fill="currentColor"
          />
        </svg>
        <p className="text-sm">A web development podcast</p>
        <p className="text-muted-foreground text-xs">
          Tasty treats for web developers by Wes Bos and Scott Tolinski.
        </p>
      </section>
    </a>
  )
}

export function ShadcnStudioAsideSponsor() {
  return (
    <a
      href="https://shadcnstudio.com/?utm_source=nuqs&utm_medium=banner&utm_campaign=github"
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <section className="text-muted-foreground space-y-4 rounded-md border border-dashed px-4 py-6 transition-colors group-hover:text-current group-active:text-current">
        <header className="mx-auto flex items-center justify-center gap-2">
          <svg
            viewBox="0 0 328 329"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="size-8"
            aria-hidden
          >
            <rect
              y="0.5"
              width="328"
              height="328"
              rx="164"
              fill="currentColor"
            />
            <path
              d="M165.018 72.3008V132.771C165.018 152.653 148.9 168.771 129.018 168.771H70.2288"
              strokeWidth="20"
              className="stroke-background"
            />
            <path
              d="M166.627 265.241L166.627 204.771C166.627 184.889 182.744 168.771 202.627 168.771L261.416 168.771"
              strokeWidth="20"
              className="stroke-background"
            />
            <line
              x1="238.136"
              y1="98.8184"
              x2="196.76"
              y2="139.707"
              strokeWidth="20"
              className="stroke-background"
            />
            <line
              x1="135.688"
              y1="200.957"
              x2="94.3128"
              y2="241.845"
              strokeWidth="20"
              className="stroke-background"
            />
            <line
              x1="133.689"
              y1="137.524"
              x2="92.5566"
              y2="96.3914"
              strokeWidth="20"
              className="stroke-background"
            />
            <line
              x1="237.679"
              y1="241.803"
              x2="196.547"
              y2="200.671"
              strokeWidth="20"
              className="stroke-background"
            />
          </svg>
          <div className="flex flex-col">
            <span className="text-sm leading-tight font-medium">
              shadcnstudio.com
            </span>
            <span className="text-muted-foreground text-xs">
              shadcn blocks & templates
            </span>
          </div>
        </header>
        <p className="text-muted-foreground text-center text-xs">
          Accelerate your project development with ready-to-use, and fully
          customizable shadcn ui Components, Blocks, UI Kits, Boilerplates,
          Templates and Themes with AI Tools 🪄.
        </p>
      </section>
    </a>
  )
}
