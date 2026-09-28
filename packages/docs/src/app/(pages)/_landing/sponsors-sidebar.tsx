import { Heart } from 'lucide-react'

export const asideSponsors: SponsorProps[] = [
  {
    name: 'Notra',
    url: 'https://www.usenotra.com/?utm_source=nuqs&utm_medium=banner&utm_campaign=nuqs',
    logoUrl: 'https://www.usenotra.com/logo-dark.svg',
    description:
      'Modern GEO tool that asks ChatGPT, Claude and Gemini the questions your buyers ask. See if you show up, who shows up instead, and how to fix it.'
  },
  {
    name: 'Unkey',
    url: 'https://unkey.com/?utm_source=nuqs&utm_medium=banner&utm_campaign=nuqs',
    logoUrl: 'https://avatars.githubusercontent.com/u/138932600?s=200&v=4',
    description: 'Ship APIs, not infrastructure.'
  },
  {
    name: 'Upstash',
    url: 'https://upstash.com/?utm_source=nuqs&utm_medium=banner&utm_campaign=nuqs',
    logoUrl: 'https://avatars.githubusercontent.com/u/74989412?s=200&v=4',
    description: 'Serverless data platform.'
  },
  {
    name: 'CodeRabbit',
    url: 'https://coderabbit.com/?utm_source=nuqs&utm_medium=banner&utm_campaign=nuqs',
    logoUrl: 'https://avatars.githubusercontent.com/u/132028505?s=200&v=4',
    description: 'AI-powered platform revolutionizing code reviews.'
  },
  {
    name: '1771 Technologies',
    url: 'https://1771technologies.com/?utm_source=nuqs&utm_medium=banner&utm_campaign=nuqs',
    logoUrl: 'https://avatars.githubusercontent.com/u/148620833?s=200&v=4',
    description:
      'Ship faster with LyteNyte Grid. The fastest React data grid ever built on the modern web.'
  }
]

export function SponsorsSidebar() {
  return (
    <aside className="mt-8">
      <a
        href="https://github.com/sponsors/franky47/sponsorships?pay_prorated=false&sponsor=franky47&tier_id=549651&metadata_source=nuqs-sidebar"
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground group mb-2 inline-flex items-center gap-2 text-xs"
      >
        <Heart
          className="ml-0.5 size-4 fill-transparent stroke-current"
          aria-label="Sponsor my work on GitHub to add your company here"
        />
        <h3 className="group-hover:underline group-active:underline">
          Sponsored by{' '}
          <code
            className="text-[0.95em] opacity-0 group-hover:opacity-100 group-active:opacity-100"
            aria-hidden
          >
            &lt;YourCompany/&gt; ?
          </code>
        </h3>
      </a>
      <ul className="-ml-1.5 space-y-0">
        {asideSponsors.map(sponsor => (
          <AsideSponsor key={sponsor.name} {...sponsor} />
        ))}
      </ul>
    </aside>
  )
}

// --

type SponsorProps = {
  name: string
  url: string
  logoUrl: string
  description: string
}

function AsideSponsor({ name, url, logoUrl, description }: SponsorProps) {
  return (
    <li>
      <a href={url} target="_blank" rel="noopener noreferrer" className="group">
        <section className="text-muted-foreground mx-auto flex items-center gap-2 py-2 transition-colors group-hover:text-current group-active:text-current">
          <img
            src={logoUrl}
            alt={name}
            className="size-8 rounded-full opacity-50 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0 group-active:opacity-100 group-active:grayscale-0"
            width={32}
            height={32}
          />
          <span className="font-semibold">{name}</span>
        </section>
      </a>
    </li>
  )
}
