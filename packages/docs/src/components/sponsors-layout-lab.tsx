import {
  AsideSponsors,
  NextJSWeeklyLogo,
  ShadcnStudioIcon,
  SPONSORS
} from '@/src/app/(pages)/_landing/sponsors'
import { cn } from '@/src/lib/utils'
import { Heart } from 'lucide-react'
import type { ReactNode } from 'react'

type LabSponsor = {
  name: string
  url: string
  tagline: string
  logo: (className?: string) => ReactNode
  wide?: boolean
}

function sponsorImage(handle: string) {
  const sponsor = SPONSORS.find(s => s.handle === handle)
  if (!sponsor) {
    throw new Error(`Unknown sponsor handle: ${handle}`)
  }
  return sponsor.img
}

function avatarLogo(handle: string, name: string, rounded: boolean) {
  const src = sponsorImage(handle)
  return function AvatarLogo(className?: string) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(rounded ? 'rounded-full' : 'rounded-md', className)}
      />
    )
  }
}

const LAB_SPONSORS: LabSponsor[] = [
  {
    name: 'Next.js Weekly',
    url: 'https://nextjsweekly.com?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    tagline: 'Stay up to date on Next.js',
    logo: className => <NextJSWeeklyLogo className={className} />,
    wide: true
  },
  {
    name: 'shadcn/studio',
    url: 'https://shadcnstudio.com/?utm_source=nuqs&utm_medium=banner&utm_campaign=github',
    tagline: 'shadcn blocks & templates',
    logo: className => <ShadcnStudioIcon className={className} />
  },
  {
    name: '1771 Technologies',
    url: 'https://1771technologies.com/?utm_source=nuqs&utm_medium=banner&utm_campaign=nuqs',
    tagline: 'The fastest React data grid',
    logo: avatarLogo('1771-Technologies', '1771 Technologies', true)
  },
  {
    name: 'Sentry',
    url: 'https://sentry.io/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    tagline: 'Application monitoring',
    logo: avatarLogo('getsentry', 'Sentry', true)
  },
  {
    name: 'CodeRabbit',
    url: 'https://www.coderabbit.ai/?dub_id=4fJt7M9XtciYhwpj',
    tagline: 'AI code reviews',
    logo: avatarLogo('coderabbitai', 'CodeRabbit', true)
  },
  {
    name: 'Upstash',
    url: 'https://upstash.com/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    tagline: 'Serverless data platform',
    logo: avatarLogo('upstash', 'Upstash', true)
  },
  {
    name: 'Vercel',
    url: 'https://vercel.com/',
    tagline: 'Frontend cloud',
    logo: avatarLogo('vercel', 'Vercel', false)
  },
  {
    name: 'Syntax.fm',
    url: 'https://syntax.fm/?utm_source=nuqs&utm_medium=sponsor&utm_campaign=nuqs',
    tagline: 'Web dev podcast',
    logo: avatarLogo('syntaxfm', 'Syntax.fm', false)
  }
]

function SponsoredByHeader() {
  return (
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
      <span className="group-hover:underline group-active:underline">
        Sponsored by
      </span>
    </a>
  )
}

// Variant 1: featured card on top, compact two-line rows below.
function AsideSponsorsTieredRows() {
  const [featured, ...rest] = LAB_SPONSORS
  return (
    <aside>
      <SponsoredByHeader />
      <a
        href={featured.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground group block space-y-2 rounded-md border border-dashed px-4 py-4 text-center transition-colors hover:text-current"
      >
        {featured.logo('mx-auto w-3/4')}
        <p className="text-xs">{featured.tagline}</p>
      </a>
      <ul className="mt-2">
        {rest.map(sponsor => (
          <li key={sponsor.name}>
            <a
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group hover:bg-accent flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors"
            >
              <span className="opacity-60 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0">
                {sponsor.logo('size-6')}
              </span>
              <span className="flex flex-col">
                <span className="text-xs leading-tight font-medium">
                  {sponsor.name}
                </span>
                <span className="text-muted-foreground text-[10px] leading-tight">
                  {sponsor.tagline}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}

// Variant 2: wordmark banner + grid of mini tiles (logo & name).
function AsideSponsorsMiniTiles() {
  const [featured, ...rest] = LAB_SPONSORS
  return (
    <aside>
      <SponsoredByHeader />
      <div className="grid grid-cols-2 gap-2">
        <a
          href={featured.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground col-span-2 flex items-center justify-center rounded-md border border-dashed px-4 py-3 transition-colors hover:text-current"
        >
          {featured.logo('h-3.5 w-auto')}
          <span className="sr-only">{featured.name}</span>
        </a>
        {rest.map(sponsor => (
          <a
            key={sponsor.name}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            title={sponsor.tagline}
            className="text-muted-foreground flex flex-col items-center gap-1.5 rounded-md border border-dashed px-2 py-3 transition-colors hover:text-current"
          >
            <span className="opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
              {sponsor.logo('size-7')}
            </span>
            <span className="text-[10px] leading-none font-medium">
              {sponsor.name}
            </span>
          </a>
        ))}
      </div>
    </aside>
  )
}

// Variant 3: logos only, packed in a single bordered box.
function AsideSponsorsLogoBox() {
  const [featured, ...rest] = LAB_SPONSORS
  return (
    <aside>
      <SponsoredByHeader />
      <div className="rounded-md border border-dashed p-3">
        <a
          href={featured.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground mb-3 flex justify-center transition-colors hover:text-current"
          title={featured.tagline}
        >
          {featured.logo('h-4 w-auto')}
          <span className="sr-only">{featured.name}</span>
        </a>
        <ul className="flex flex-wrap items-center justify-center gap-2">
          {rest.map(sponsor => (
            <li key={sponsor.name}>
              <a
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${sponsor.name} — ${sponsor.tagline}`}
                className="block opacity-60 grayscale transition-all hover:scale-110 hover:opacity-100 hover:grayscale-0"
              >
                {sponsor.logo('size-8')}
                <span className="sr-only">{sponsor.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

// Variant 4: borderless logo cloud of inline name lockups.
function AsideSponsorsLogoCloud() {
  const [featured, ...rest] = LAB_SPONSORS
  return (
    <aside>
      <SponsoredByHeader />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <a
          href={featured.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground mb-1 w-full transition-colors hover:text-current"
          title={featured.tagline}
        >
          {featured.logo('h-3.5 w-auto')}
          <span className="sr-only">{featured.name}</span>
        </a>
        {rest.map(sponsor => (
          <a
            key={sponsor.name}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            title={sponsor.tagline}
            className="text-muted-foreground flex items-center gap-1.5 transition-all hover:text-current"
          >
            <span className="opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
              {sponsor.logo('size-4')}
            </span>
            <span className="text-xs font-medium">{sponsor.name}</span>
          </a>
        ))}
      </div>
    </aside>
  )
}

// Variant 5: CSS-only rotating spotlight card + avatar strip.
function AsideSponsorsSpotlight() {
  const featured = LAB_SPONSORS.slice(0, 3)
  return (
    <aside>
      <style>{`
        @keyframes sponsor-spotlight-fade {
          0% { opacity: 0; visibility: hidden }
          4%, 29% { opacity: 1; visibility: visible }
          33%, 100% { opacity: 0; visibility: hidden }
        }
        .sponsor-spotlight-card {
          animation: sponsor-spotlight-fade 12s infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .sponsor-spotlight-card { animation: none }
        }
      `}</style>
      <SponsoredByHeader />
      <div className="grid">
        {featured.map((sponsor, index) => (
          <a
            key={sponsor.name}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'sponsor-spotlight-card text-muted-foreground col-start-1 row-start-1 flex flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-4 text-center transition-colors hover:text-current',
              index > 0 && 'invisible opacity-0'
            )}
            style={{ animationDelay: `${(index - featured.length) * 4}s` }}
          >
            {sponsor.wide ? (
              <>
                {sponsor.logo('mx-auto w-3/4')}
                <span className="sr-only">{sponsor.name}</span>
              </>
            ) : (
              <span className="flex items-center gap-2">
                {sponsor.logo('size-6')}
                <span className="text-sm font-medium">{sponsor.name}</span>
              </span>
            )}
            <p className="text-xs">{sponsor.tagline}</p>
          </a>
        ))}
      </div>
      <ul className="mt-3 flex items-center justify-center gap-2">
        {LAB_SPONSORS.filter(sponsor => !sponsor.wide).map(sponsor => (
          <li key={sponsor.name}>
            <a
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${sponsor.name} — ${sponsor.tagline}`}
              className="block opacity-60 grayscale transition-all hover:scale-110 hover:opacity-100 hover:grayscale-0"
            >
              {sponsor.logo('size-6')}
              <span className="sr-only">{sponsor.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}

const VARIANTS: { title: string; note: string; render: () => ReactNode }[] = [
  {
    title: 'Current',
    note: 'Three cards with descriptions, one per sponsor.',
    render: () => <AsideSponsors />
  },
  {
    title: '1. Tiered rows',
    note: 'Featured card on top, compact rows with taglines below.',
    render: () => <AsideSponsorsTieredRows />
  },
  {
    title: '2. Mini tiles',
    note: 'Wordmark banner + 2-column grid of logo & name tiles.',
    render: () => <AsideSponsorsMiniTiles />
  },
  {
    title: '3. Logo box',
    note: 'Logos only in a single box, names & taglines on hover.',
    render: () => <AsideSponsorsLogoBox />
  },
  {
    title: '4. Logo cloud',
    note: 'Borderless inline lockups, most compact.',
    render: () => <AsideSponsorsLogoCloud />
  },
  {
    title: '5. Spotlight',
    note: 'CSS-only rotating featured card + logo strip.',
    render: () => <AsideSponsorsSpotlight />
  }
]

/** @public - used in the design-system MDX page (not traceable by knip) */
export function SponsorsLayoutLab() {
  return (
    <div className="not-prose flex flex-wrap gap-6">
      {VARIANTS.map(variant => (
        <figure key={variant.title} className="w-[268px] shrink-0">
          <figcaption className="mb-2">
            <span className="block text-sm font-semibold">{variant.title}</span>
            <span className="text-muted-foreground block text-xs">
              {variant.note}
            </span>
          </figcaption>
          <div className="rounded-lg border p-3">{variant.render()}</div>
        </figure>
      ))}
    </div>
  )
}
