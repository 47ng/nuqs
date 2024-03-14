import { Button } from '@/src/components/ui/button'
import { Heart } from 'lucide-react'
import Image from 'next/image'
import { z } from 'zod'

export async function SponsorsSection() {
  const sponsors = await fetchSponsors()
  return (
    <section className="mb-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter dark:text-white md:text-4xl xl:text-5xl">
        Sponsors
      </h2>
      <div className="flex flex-wrap justify-center gap-4">
        {sponsors.map(sponsor => (
          <a
            key={sponsor.handle}
            href={sponsor.url}
            className="h-32 w-32 rounded-full text-center"
          >
            <Image
              src={sponsor.img}
              alt={sponsor.name ?? sponsor.handle}
              className="rounded-full"
              width={128}
              height={128}
            />
            <span className="mt-2 inline-block text-sm text-zinc-500">
              {sponsor.name ?? sponsor.handle}
            </span>
          </a>
        ))}
      </div>
      <div className="mt-16 flex justify-center">
        <Button className="mx-auto" asChild variant="outline">
          <a href="#">
            <Heart className="mr-2 text-pink-500" size={16} /> Sponsor my work
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
  img: z.string().url()
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
    // GitHub sponsors
    {
      handle: 'rwieruch',
      name: 'Robin Wieruch',
      url: 'https://github.com/rwieruch',
      img: 'https://avatars.githubusercontent.com/u/2479967?u=cba76c8678af8e63ee2dd32853a4e262b35f9ac0&v=4'
    },
    // Other sponsors
    {
      handle: 'YoannFleuryDev',
      name: 'Yoann Fleury',
      url: 'https://twitter.com/YoannFleuryDev',
      img: 'https://pbs.twimg.com/profile_images/1594632934245498880/CJTKNRCO_400x400.jpg'
    }
  ]
}
