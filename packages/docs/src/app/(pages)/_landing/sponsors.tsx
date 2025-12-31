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
        Co-Founder of{' '}
        <a href="https://marblecms.com" className="hover:underline">
          Marble
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
    handle: 'ajaypatelaj',
    name: 'Ajay Patel',
    url: 'https://shadcnstudio.com/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    img: 'https://avatars.githubusercontent.com/u/749684?s=200&v=4'
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
        <li key={sponsor.handle} className="flex flex-col items-center">
          <a
            href={sponsor.url}
            className="size-12 rounded-full transition-transform hover:scale-125"
          >
            <img
              src={sponsor.img}
              alt={sponsor.name ?? sponsor.handle}
              className="mx-auto size-12 rounded-full"
              title={sponsor.name ?? sponsor.handle}
              width={48}
              height={48}
            />
          </a>
          {/* <a
            href={sponsor.url}
            className="mt-2 inline-block text-center font-medium hover:underline"
          >
            {sponsor.name ?? sponsor.handle}
          </a> */}
          {/* {Boolean(sponsor.title) && (
            <span className="mt-1 inline-block text-sm text-zinc-500">
              {sponsor.title}
            </span>
          )} */}
        </li>
      ))}
    </ul>
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
