import { cn } from '@/src/lib/utils'
import { z } from 'zod'

const contributorSchema = z.object({
  login: z.string(),
  html_url: z.url(),
  avatar_url: z.url(),
  type: z.string(),
  contributions: z.number()
})
type Contributor = z.infer<typeof contributorSchema>

async function fetchContributors(): Promise<Contributor[]> {
  const url = new URL('https://api.github.com/repos/47ng/nuqs/contributors')
  url.searchParams.set('per_page', '27')
  // anon=false by default; we only want registered users

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json'
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const res = await fetch(url.toString(), {
    headers,
    next: {
      revalidate: 86_400,
      tags: ['contributors']
    }
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch contributors: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  const contributors = z.array(contributorSchema).parse(data)

  // Filter bots (type Bot, or login including [bot], or known bot accounts)
  const isHuman = (c: Contributor) => {
    const loginLower = c.login.toLowerCase()
    if (c.type === 'Bot') return false
    if (loginLower.endsWith('[bot]')) return false
    if (loginLower.includes('bot')) return false
    return true
  }

  const humans = contributors.filter(isHuman)
  humans.sort((a, b) => b.contributions - a.contributions)
  return humans
}

export async function ContributorsSection() {
  let contributors: Contributor[] = []
  try {
    contributors = await fetchContributors()
  } catch (error) {
    console.error(error)
    return <section className="text-red-500">{String(error)}</section>
  }

  if (contributors.length === 0) return null

  return (
    <section className="container mb-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tighter md:text-4xl xl:text-5xl dark:text-white">
        Contributors
      </h2>
      <ul className={cn('grid grid-cols-4 gap-y-8 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 justify-items-center')}>
        {contributors.map(c => (
          <li key={c.login} className="flex flex-col items-center">
            <a
              href={c.html_url}
              className="h-16 w-16 rounded-full transition-transform hover:scale-110 md:h-20 md:w-20"
              title={`${c.login} (${c.contributions} contributions)`}
            >
              <img
                src={`${c.avatar_url}&s=200`}
                alt={c.login}
                className="mx-auto h-16 w-16 rounded-full md:h-20 md:w-20"
                loading="lazy"
                width={80}
                height={80}
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}


