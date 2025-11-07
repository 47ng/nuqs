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
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json'
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  let allContributors: Contributor[] = []
  let page = 1
  const perPage = 100 // GitHub API max per page

  while (true) {
    const url = new URL('https://api.github.com/repos/47ng/nuqs/contributors')
    url.searchParams.set('per_page', perPage.toString())
    url.searchParams.set('page', page.toString())
    // anon=false by default; we only want registered users

    const res = await fetch(url.toString(), {
      headers,
      next: {
        tags: ['contributors']
      }
    })

    if (!res.ok) {
      throw new Error(
        `Failed to fetch contributors: ${res.status} ${res.statusText}`
      )
    }

    const data = await res.json()
    const contributors = z.array(contributorSchema).parse(data)

    // If we get fewer contributors than perPage, we've reached the end
    if (contributors.length < perPage) {
      allContributors = allContributors.concat(contributors)
      break
    }

    allContributors = allContributors.concat(contributors)
    page++
  }

  // Known bot account IDs - easily editable list
  const knownBotIds = new Set([
    'dependabot[bot]',
    'dependabot-preview[bot]',
    'renovate[bot]',
    'renovate-bot',
    'depfu[bot]',
    'greenkeeper[bot]',
    'mergify[bot]',
    'mergify-bot',
    'github-actions[bot]',
    'github-actions-bot',
    'codecov[bot]',
    'codecov-io[bot]',
    'snyk-bot',
    'snyk[bot]',
    'semantic-release[bot]',
    'semantic-release-bot',
    'release-drafter[bot]',
    'release-drafter-bot',
    'stale[bot]',
    'stale-bot',
    'app[bot]',
    'app-bot',
    'web-flow[bot]',
    'web-flow-bot'
  ])

  // Filter bots (type Bot, or known bot accounts, or login ending with [bot])
  const isHuman = (c: Contributor) => {
    const loginLower = c.login.toLowerCase()

    // Check if it's explicitly a Bot type
    if (c.type === 'Bot') return false

    // Check against known bot IDs (exact match)
    if (knownBotIds.has(loginLower)) return false

    // Check if login ends with [bot] (common pattern for GitHub bots)
    if (loginLower.endsWith('[bot]')) return false

    return true
  }

  const humans = allContributors.filter(isHuman)
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
      <ul
        className={cn(
          'flex flex-wrap justify-center gap-x-3 gap-y-4 md:gap-x-4'
        )}
      >
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
