'use client'

import type { ReactNode } from 'react'
import {
  Marquee,
  MarqueeContent,
  MarqueeFadeLeft,
  MarqueeFadeRight,
  MarqueeItem
} from '@/src/components/marquee'
import {
  Testimonial,
  TestimonialAuthor,
  TestimonialAuthorName,
  TestimonialAuthorTagline,
  TestimonialAvatar,
  TestimonialAvatarImg,
  TestimonialAvatarRing,
  TestimonialQuote
} from '@/src/components/testimonial'

type AvatarX = {
  service: 'x'
  handle: string
}
type AvatarGitHub = {
  service: 'github'
  handle: string
}
type AvatarOther = {
  service: 'http'
  href: string
}
type Avatar = AvatarX | AvatarGitHub | AvatarOther

function getAvatarUrl(avatar: Avatar) {
  switch (avatar.service) {
    case 'x':
      return `https://unavatar.io/x/${avatar.handle}`
    case 'github':
      return `https://unavatar.io/github/${avatar.handle}`
    case 'http':
      return avatar.href
  }
}

function getHandle(avatar: Avatar): string | null {
  if (avatar.service === 'x') return `@${avatar.handle}`
  if (avatar.service === 'github') return avatar.handle
  return null
}

type QuoteData = {
  text: ReactNode
  author: {
    name: string
    avatar: Avatar
  }
  url: string
}

const quotes: QuoteData[] = [
  {
    text: 'I started building my own hook helpers for handling URL states and had to deal with some performance drawbacks. Eventually stumbled on this little beauty and it has everything I wanted and more.',
    author: { name: 'N8', avatar: { service: 'x', handle: 'nathanbrachotte' } },
    url: 'https://x.com/nathanbrachotte/status/1747244520163397659'
  },
  {
    text: "It's a database ORM for your URL",
    author: { name: 'Marc Seitz', avatar: { service: 'x', handle: 'mfts0' } },
    url: 'https://x.com/mfts0/status/1814577051703066783'
  },
  {
    text: <>We use nuqs pretty much everywhere 🖤</>,
    author: {
      name: 'Pontus Abrahamsson',
      avatar: { service: 'x', handle: 'pontusab' }
    },
    url: 'https://x.com/pontusab/status/1774434057469780028'
  },
  {
    text: 'nuqs is fkn dope',
    author: { name: 'kitze', avatar: { service: 'x', handle: 'thekitze' } },
    url: 'https://x.com/thekitze/status/1909576710179471466'
  },
  {
    text: 'thx a lot for this awesome library! I was syncing with URL like nextjs recommends .. performance are awful and I was about to move back to useState.',
    author: {
      name: 'Darathor17',
      avatar: { service: 'github', handle: 'Darathor17' }
    },
    url: 'https://github.com/47ng/nuqs/discussions/444'
  },
  {
    text: 'nuqs has to be one of the best libraries out there. lifting state to the url is so easy now and far better for ux.',
    author: { name: 'ahmet', avatar: { service: 'x', handle: 'bruvimtired' } },
    url: 'https://x.com/bruvimtired/status/1944437102562759144'
  },
  {
    text: (
      <>
        <p>
          Just used the nuqs library for the first time today… and wow -
          syncing URL query params in Next.js has never felt this elegant.
        </p>
        <p>
          Parsing, defaults, clearOnDefault — it's pretty wild
          <br />
          Where has this been all my life?
        </p>
      </>
    ),
    author: { name: 'Aryan', avatar: { service: 'x', handle: 'AryaAmour08' } },
    url: 'https://x.com/AryaAmour08/status/1946565369537446127'
  },
  {
    text: 'Sometimes, there is no need to complicate managing state. nuqs is really powerful.',
    author: {
      name: 'Ru Chern Chong',
      avatar: {
        service: 'http',
        href: 'https://pbs.twimg.com/profile_images/1864759220048138240/cX7JIFtb_400x400.jpg'
      }
    },
    url: 'https://x.com/ruchernchong/status/1946618077581619392'
  },
  {
    text: 'nuqs simplifies your URL logic like magic. Seriously.',
    author: {
      name: 'Bharat Kara',
      avatar: { service: 'x', handle: 'KaraBharat' }
    },
    url: 'https://x.com/KaraBharat/status/1947984051840983521'
  },
  {
    text: 'It made me realize URL should be part of the design convo not just a place to dump state. Since I started using nuqs more heavily in production, the way I see and treat URL completely changed.',
    author: {
      name: 'Ido Evergreen',
      avatar: { service: 'x', handle: 'IdoEvergreen' }
    },
    url: 'https://x.com/IdoEvergreen/status/1948014681207030054'
  },
  {
    text: 'The goat library',
    author: {
      name: 'Rhys Sullivan',
      avatar: { service: 'x', handle: 'RhysSullivan' }
    },
    url: 'https://x.com/RhysSullivan/status/1971327979369398579'
  },
  {
    text: 'best library ever',
    author: {
      name: 'Virgile Rietsch',
      avatar: { service: 'x', handle: 'virgilerietsch' }
    },
    url: 'https://x.com/virgilerietsch/status/1971320475180823012'
  },
  {
    text: 'i love nuqs',
    author: {
      name: 'Dominik Koch',
      avatar: { service: 'x', handle: 'dominikkoch' }
    },
    url: 'https://x.com/DominikDoesDev/status/1973696846079135968'
  },
  {
    text: "nuqs is one of my favorite pieces of software recently. don't mean to glaze but man, it's a type-safe, way better version of react state",
    author: {
      name: 'Josh tried coding',
      avatar: { service: 'x', handle: 'joshtriedcoding' }
    },
    url: 'https://x.com/joshtriedcoding/status/1981561126254235959'
  },
  {
    text: 'Just did first custom parser today, pretty simple .. great API design 👌',
    author: {
      name: 'Pavel Svitek',
      avatar: { service: 'x', handle: 'pavelsvitek_' }
    },
    url: 'https://x.com/pavelsvitek_/status/1976329834981925328'
  },
  {
    text: "Keep it up guys! You're doing a great job! I'm using nuqs on real projects in production already, it's amazing how easy it is to control URL params.",
    author: { name: 'OrcDev', avatar: { service: 'x', handle: 'orcdev' } },
    url: 'https://x.com/orcdev/status/1849368178717290945'
  },
  {
    text: 'nuqs is the perfect solution to the epidemically annoying problem of query param state management. I wish I had this 10 years ago',
    author: {
      name: 'Brandon McConnell',
      avatar: { service: 'x', handle: 'branmcconnell' }
    },
    url: 'https://x.com/branmcconnell/status/1976717520653459678'
  },
  {
    text: 'goated library',
    author: { name: 'Iza', avatar: { service: 'x', handle: 'izadoesdev' } },
    url: 'https://x.com/izadoesdev/status/1977276660090388523'
  },
  {
    text: 'i am so happy every time i get to use nuqs!',
    author: {
      name: 'Code With Antonio',
      avatar: { service: 'x', handle: 'codewithantonio' }
    },
    url: 'https://x.com/YTCodeAntonio/status/1978044756157481313'
  },
  {
    text: 'also, nuqs is amazing',
    author: { name: 'arth', avatar: { service: 'x', handle: 'arthty' } },
    url: 'https://x.com/arthty/status/1980237430256234768'
  },
  {
    text: 'one of the most useful pieces of library ever made. thx for making our life easier as devs and ux way better for our users',
    author: {
      name: 'Mr T.',
      avatar: { service: 'x', handle: 'DorianTho5' }
    },
    url: 'https://x.com/DorianTho5/status/1981419755723739213'
  },
  {
    text: 'deez nuqs',
    author: {
      name: 'Hayden Bleasel',
      avatar: { service: 'x', handle: 'haydenbleasel' }
    },
    url: 'https://x.com/haydenbleasel/status/1981572915591258189'
  },
  {
    text: 'Really glad to finally met Francois from nuqs! I love using it!',
    author: {
      name: 'Christopher Burns',
      avatar: { service: 'x', handle: 'BurnedChris' }
    },
    url: 'https://x.com/BurnedChris/status/1981071113154417018'
  },
  {
    text: 'I integrated nuqs into an internal project, and it helped simplify filter-related query logic and reduce development time.',
    author: {
      name: 'Ch\u00e1nh \u0110\u1ea1i',
      avatar: { service: 'x', handle: 'iamncdai' }
    },
    url: 'https://x.com/iamncdai/status/1981606278444249232'
  },
  {
    text: 'Big fan of nuqs!',
    author: {
      name: 'Abhishek Chauhan',
      avatar: { service: 'x', handle: 'abhishekashwinc' }
    },
    url: 'https://x.com/abhishekashwinc/status/1981613111472996827'
  },
  {
    text: "meeting the guy behind nuqs was insane. it's one of those tools literally every web dev should know about",
    author: {
      name: 'Michael',
      avatar: { service: 'x', handle: 'michael_chomsky' }
    },
    url: 'https://x.com/michael_chomsky/status/1981633873529471064'
  },
  {
    text: 'nuqs is so goated',
    author: {
      name: 'James Perkins',
      avatar: { service: 'x', handle: 'jamesperkins' }
    },
    url: 'https://x.com/jamesperkins/status/1981744427132424690'
  },
  {
    text: (
      <>
        <p>thank you for your hard work 🫶</p>
        <p>nuqs is awesome</p>
      </>
    ),
    author: { name: 'dmytro', avatar: { service: 'x', handle: 'pqoqubbw' } },
    url: 'https://x.com/pqoqubbw/status/1981753810654494892'
  },
  {
    text: 'Currently Using nuqs to add some pagination and searching feature into my nextjs app and i am loving it',
    author: {
      name: 'Suraj Jha',
      avatar: { service: 'x', handle: 'surajtwt_' }
    },
    url: 'https://x.com/surajtwt_/status/1982684604307034362'
  },
  {
    text: 'We started using nuqs and achieved world peace internally.',
    author: {
      name: 'shibbi',
      avatar: { service: 'x', handle: 'shibbicodes' }
    },
    url: 'https://x.com/shibbicodes/status/2002396495832817803'
  },
  {
    text: (
      <>
        <p>
          Big thanks to nuqs for making URL state management actually
          enjoyable! 🙌
        </p>
        <br />
        <ul>
          <li>useState but synced with the URL? ✅</li>
          <li>Type-safe? ✅</li>
          <li>Works everywhere (Next.js, Remix, React Router)? ✅</li>
          <li>Only 6kb? ✅</li>
        </ul>
        <br />
        <p>Happy to support such a well-crafted library 😇</p>
      </>
    ),
    author: {
      name: 'Ajay Patel',
      avatar: { service: 'x', handle: 'ajaypatel_aj' }
    },
    url: 'https://x.com/ajaypatel_aj/status/2004082719047778362'
  },
  {
    text: 'I LOVE NUQS I LOVE PARAMS THAT JUST WORK AHAHA WOOHOOO❤️❤️❤️❤️',
    author: {
      name: 'anarki supreme',
      avatar: { service: 'x', handle: 'basedanarki' }
    },
    url: 'https://x.com/basedanarki/status/2001970260426318003'
  },
  {
    text: "this is a huge time saver 😍 nuqs is literally the first thing i add to a project after some basic ui like tabs & toggles",
    author: { name: 'Matt', avatar: { service: 'x', handle: 'uixmat' } },
    url: 'https://x.com/uixmat/status/1987809486329860602'
  }
]

// Sort quotes by text length: shorter quotes on top row, longer on bottom row
function getTextLength(text: ReactNode): number {
  if (typeof text === 'string') return text.length
  // React nodes (e.g. multi-paragraph) are treated as long
  return 999
}

const sorted = [...quotes].sort(
  (a, b) => getTextLength(a.text) - getTextLength(b.text)
)
const mid = Math.ceil(sorted.length / 2)
const firstRow = sorted.slice(0, mid)
const secondRow = sorted.slice(mid)

function QuoteCard({ quote }: { quote: QuoteData }) {
  const handle = getHandle(quote.author.avatar)
  return (
    <a
      href={quote.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full"
    >
      <Testimonial className="w-72 rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:w-80">
        <TestimonialQuote className="text-zinc-800 dark:text-zinc-200">
          {quote.text}
        </TestimonialQuote>
        <TestimonialAuthor>
          <TestimonialAvatar>
            <TestimonialAvatarImg
              src={getAvatarUrl(quote.author.avatar)}
              alt={quote.author.name}
              crossOrigin="anonymous"
              loading="lazy"
            />
            <TestimonialAvatarRing />
          </TestimonialAvatar>
          <div className="grid gap-0.5">
            <TestimonialAuthorName>{quote.author.name}</TestimonialAuthorName>
            {handle && (
              <TestimonialAuthorTagline>{handle}</TestimonialAuthorTagline>
            )}
          </div>
        </TestimonialAuthor>
      </Testimonial>
    </a>
  )
}

export function QuotesSection() {
  return (
    <section className="my-24 space-y-4">
      <Marquee>
        <MarqueeFadeLeft />
        <MarqueeContent>
          {firstRow.map(quote => (
            <MarqueeItem key={quote.url} className="px-2">
              <QuoteCard quote={quote} />
            </MarqueeItem>
          ))}
        </MarqueeContent>
        <MarqueeFadeRight />
      </Marquee>
      <Marquee>
        <MarqueeFadeLeft />
        <MarqueeContent direction="right">
          {secondRow.map(quote => (
            <MarqueeItem key={quote.url} className="px-2">
              <QuoteCard quote={quote} />
            </MarqueeItem>
          ))}
        </MarqueeContent>
        <MarqueeFadeRight />
      </Marquee>
    </section>
  )
}
