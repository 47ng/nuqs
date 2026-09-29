import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'
import { Heart } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { z } from 'zod'

const sponsorSchema = z.object({
  name: z.string().nullish(),
  handle: z.string(),
  githubOwners: z.array(z.string()).optional(),
  url: z.string().url(),
  img: z.string(),
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
    handle: 'getsentry',
    name: 'Sentry',
    url: 'https://sentry.io/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    img: '/sponsors/sentry.svg'
  },
  {
    handle: 'syntaxfm',
    name: 'Syntax.fm',
    url: 'https://syntax.fm/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    img: 'https://avatars.githubusercontent.com/u/130389858?s=200&v=4'
  },
  {
    handle: '1771-Technologies',
    name: '1771 Technologies',
    url: 'https://1771technologies.com/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    img: 'https://avatars.githubusercontent.com/u/148620833?s=200&v=4'
  },
  {
    handle: 'usenotra',
    name: 'Notra',
    url: 'https://www.usenotra.com/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    img: 'https://www.usenotra.com/logo-dark.svg'
  },
  {
    handle: 'upstash',
    name: 'Upstash',
    url: 'https://upstash.com/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    img: '/sponsors/upstash.svg'
  },
  {
    handle: 'coderabbitai',
    name: 'CodeRabbit',
    url: 'https://www.coderabbit.ai/?dub_id=4fJt7M9XtciYhwpj',
    img: '/sponsors/coderabbit.svg'
  },
  {
    handle: 'neondatabase',
    name: 'Neon',
    url: 'https://neon.com/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    img: 'https://avatars.githubusercontent.com/u/77690634?s=200&v=4'
  },
  {
    handle: 'unkeyed',
    name: 'Unkey',
    url: 'https://unkey.com',
    img: 'https://avatars.githubusercontent.com/u/138932600?s=200&v=4'
  },
  {
    handle: 'openstatusHQ',
    name: 'OpenStatus',
    url: 'https://openstatus.dev',
    img: 'https://avatars.githubusercontent.com/u/136892265?s=200&v=4'
  },
  {
    handle: 'databuddy-analytics',
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
    handle: 'TradingGoose',
    name: 'TradingGoose',
    url: 'https://www.tradinggoose.ai/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    img: 'https://avatars.githubusercontent.com/u/226357056?s=200&v=4'
  },
  {
    handle: 'loops-so',
    name: 'Loops',
    url: 'https://loops.so/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    img: 'https://avatars.githubusercontent.com/u/93287080?s=200&v=4'
  },
  {
    handle: 'teknikgeek',
    name: 'TeknikGeek',
    url: 'https://www.teknikgeek.se/',
    img: '/sponsors/teknikgeek.jpeg'
  },
  {
    handle: 'pqoqubbw',
    name: 'dmytro',
    url: 'https://pqoqubbw.dev/',
    img: 'https://avatars.githubusercontent.com/u/71014515?s=200&v=4',
    title: 'Design Engineer @ Mintlify'
  },
  {
    handle: 'ryanmagoon',
    name: 'Ryan Magoon',
    url: 'https://x.com/ryanmagoon',
    img: 'https://avatars.githubusercontent.com/u/5327290?s=200&v=4',
    title: 'Engineer @ PayPal'
  },
  {
    handle: 'rauchg',
    name: 'Guillermo Rauch',
    url: 'https://x.com/rauchg',
    img: 'https://avatars.githubusercontent.com/u/13041?s=200&v=4',
    title: 'Chief Triangle Officer'
  },
  {
    handle: 'pontusab',
    githubOwners: ['midday-ai'],
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
    githubOwners: ['Openpanel-dev'],
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
        <a href="https://www.usenotra.com" className="hover:underline">
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
    img: 'https://avatars.githubusercontent.com/u/39114868?s=200&v=4',
    title: (
      <>
        Creator of{' '}
        <a
          href="https://executor.sh/?utm_source=nuqs"
          className="hover:underline"
        >
          Executor.sh
        </a>
      </>
    )
  },
  {
    handle: 'brandonmcconnell',
    name: 'Brandon McConnell',
    url: 'https://github.com/brandonmcconnell',
    img: 'https://avatars.githubusercontent.com/u/5913254?s=200&v=4',
    title: 'Frontend Engineer @ Mintlify'
  },
  {
    handle: 'haydenbleasel',
    name: 'Hayden Bleasel',
    url: 'https://www.haydenbleasel.com/',
    img: 'https://avatars.githubusercontent.com/u/4142719?s=200&v=4',
    title: 'MTS @ OpenAI'
  },
  {
    handle: 'DavidHDev',
    name: 'David Haz',
    url: 'https://github.com/DavidHDev',
    img: 'https://avatars.githubusercontent.com/u/48634587?s=200&v=4',
    title: (
      <>
        Creator of{' '}
        <a
          href="https://reactbits.dev/?utm_source=nuqs"
          className="hover:underline"
        >
          React Bits
        </a>
      </>
    )
  },
  {
    handle: 'TheOrcDev',
    name: 'OrcDev',
    url: 'https://x.com/orcdev',
    img: 'https://avatars.githubusercontent.com/u/7549148?s=200&v=4',
    title: (
      <>
        Warchief of{' '}
        <a
          href="https://shipper.club/?utm_source=nuqs"
          className="hover:underline"
        >
          Shipper Club
        </a>
      </>
    )
  },
  {
    handle: 'AlemTuzlak',
    name: 'Alem Tuzlak',
    url: 'https://github.com/AlemTuzlak',
    img: 'https://avatars.githubusercontent.com/u/18480956?s=200&v=4',
    title: 'TanStack AI & Devtools maintainer'
  }
]

const sponsorOwners = new Set(
  SPONSORS.flatMap(sponsor => [
    sponsor.handle.toLowerCase(),
    ...(sponsor.githubOwners ?? []).map(owner => owner.toLowerCase())
  ])
)

export function isSponsor(owner: string) {
  return sponsorOwners.has(owner.toLowerCase())
}

export function SponsorsSection() {
  return (
    <section className="mb-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter md:text-4xl xl:text-5xl dark:text-white">
        Sponsors
      </h2>
      {/* <div className="mb-12 flex flex-wrap items-center justify-center gap-8">
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
      </div> */}
      <ul className="container flex flex-wrap justify-center gap-x-4 gap-y-8 md:gap-x-6 lg:gap-x-0">
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
              className="mt-2 inline-block text-center font-semibold hover:underline"
            >
              {sponsor.name ?? sponsor.handle}
            </a>
            {Boolean(sponsor.title) && (
              <span className="mt-1 inline-block text-center text-sm text-zinc-600 dark:text-zinc-400">
                {sponsor.title}
              </span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-16 flex justify-center">
        <Button className="text-md mx-auto font-semibold" asChild size="lg">
          <a href="https://github.com/sponsors/franky47?metadata_source=nuqs-landing">
            <Heart className="mr-2 stroke-pink-500" size={18} /> Sponsor my work
          </a>
        </Button>
      </div>
    </section>
  )
}

// --

/** @public - used in MDX blog posts via path alias (not traceable by knip) */
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
