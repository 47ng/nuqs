import { Button } from '@/src/components/ui/button'
import { Heart } from 'lucide-react'
import { ReactNode } from 'react'
import { z } from 'zod'

export async function SponsorsSection() {
  const sponsors = await fetchSponsors()
  return (
    <section className="mb-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter dark:text-white md:text-4xl xl:text-5xl">
        Sponsors
      </h2>
      <ul className="container grid grid-cols-2 gap-y-12 md:grid-cols-4">
        {sponsors.map(sponsor => (
          <li key={sponsor.handle} className="flex flex-col items-center">
            <a href={sponsor.url} className="h-32 w-32 rounded-full">
              <img
                src={sponsor.img}
                alt={sponsor.name ?? sponsor.handle}
                className="mx-auto size-28 rounded-full"
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

const sponsorSchema = z.object({
  name: z.string().nullish(),
  handle: z.string(),
  url: z.string().url(),
  img: z.string().url(),
  title: z.custom<ReactNode>()
})
type Sponsors = z.infer<typeof sponsorSchema>[]

async function fetchSponsors(): Promise<Sponsors> {
  // GraphQL query (might take time to configure two tokens with correct scopes
  // to do this automatically, but right now CBA).
  // {
  //   user(login: "franky47") {
  //     sponsors(first: 100) {
  //       nodes {
  //         ... on User {
  //           handle: login
  //           name
  //           url
  //           img: avatarUrl
  //         }
  //         ... on Organization {
  //           handle: login
  //           name
  //           url
  //           img: avatarUrl
  //         }
  //       }
  //     }
  //   }
  // }
  return [
    {
      handle: 'vercel',
      name: 'Vercel',
      url: 'https://vercel.com/',
      img: 'https://avatars.githubusercontent.com/u/14985020?v=4'
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
      handle: 'ryanmagoon',
      name: 'Ryan Magoon',
      url: 'https://x.com/Ryan_Magoon',
      img: 'https://avatars.githubusercontent.com/u/5327290?v=4'
    },
    {
      handle: 'pontusab',
      name: 'Pontus Abrahamsson',
      url: 'https://x.com/pontusab',
      img: 'https://avatars.githubusercontent.com/u/655158?v=4',
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
      img: 'https://avatars.githubusercontent.com/u/2479967?v=4',
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
      handle: 'YoannFleuryDev',
      name: 'Yoann Fleury',
      url: 'https://www.yoannfleury.dev/',
      img: 'https://pbs.twimg.com/profile_images/1594632934245498880/CJTKNRCO_400x400.jpg',
      title: 'Front end developer'
    }
  ]
}
