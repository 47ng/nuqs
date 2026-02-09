import dayjs from 'dayjs'
import type { Metadata } from 'next'
import { z } from 'zod'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle
} from 'fumadocs-ui/page'
import { PullRequestLine } from '../../../components/ui/pr-line'

export const metadata: Metadata = {
  title: 'Changelog'
}

export const revalidate = false

type CategoryId = 'features' | 'bug-fixes' | 'documentation' | 'other-changes'

const CATEGORY_ORDER: CategoryId[] = [
  'features',
  'bug-fixes',
  'documentation',
  'other-changes'
]

const CATEGORY_LABELS: Record<CategoryId, string> = {
  features: 'Features',
  'bug-fixes': 'Bug fixes',
  documentation: 'Documentation',
  'other-changes': 'Other changes'
}

type ReleaseNoteItem = {
  number: number
}

type ReleaseCategories = Record<CategoryId, ReleaseNoteItem[]>

const GithubReleaseSchema = z.object({
  id: z.number(),
  tag_name: z.string(),
  name: z.string().nullable(),
  html_url: z.string(),
  published_at: z.string().nullable(),
  body: z.string().nullable(),
  draft: z.boolean().optional(),
  prerelease: z.boolean().optional()
})

const GithubReleaseArray = z.array(GithubReleaseSchema)

type GithubRelease = z.infer<typeof GithubReleaseSchema>

async function fetchReleases(): Promise<GithubRelease[]> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json'
  }
  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.Authorization = `bearer ${token}`
  }

  const response = await fetch(
    'https://api.github.com/repos/47ng/nuqs/releases?per_page=50',
    {
      headers,
      // Let Next.js cache + revalidate this page manually via tags
      next: { tags: ['releases'] }
    }
  )

  if (!response.ok) {
    console.error(
      'Failed to fetch releases:',
      response.status,
      response.statusText
    )
    return []
  }

  const data = GithubReleaseArray.parse(await response.json())
  return data.filter(release => !release.draft && !release.prerelease)
}

function classifyHeading(heading: string): CategoryId {
  const h = heading.toLowerCase()
  if (h.includes('feature')) return 'features'
  if (h.includes('bug') || h.includes('fix')) return 'bug-fixes'
  if (h.includes('doc')) return 'documentation'
  return 'other-changes'
}

function parseReleaseBody(body?: string | null): ReleaseCategories {
  const categories: ReleaseCategories = {
    features: [],
    'bug-fixes': [],
    documentation: [],
    'other-changes': []
  }

  if (!body) return categories

  const lines = body.split(/\r?\n/)
  let currentCategory: CategoryId = 'other-changes'

  for (const rawLine of lines) {
    const line = rawLine.trim()

    // Headings like "### Features", "### Bug fixes", etc.
    const headingMatch = /^#{2,3}\s+(.+)$/.exec(line)
    if (headingMatch) {
      // Skip "Thanks" section
      if (/thanks/i.test(headingMatch[1])) continue
      currentCategory = classifyHeading(headingMatch[1])
      continue
    }

    // Bullet lines
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const prMatch = /#(\d{1,6})\b/.exec(line)
      const prNumber = prMatch ? Number(prMatch[1]) : undefined

      if (prNumber) {
        categories[currentCategory].push({ number: prNumber })
      }
    }
  }

  return categories
}

function formatDate(date?: string | null): string | null {
  if (!date) return null
  const parsed = dayjs(date)
  if (!parsed.isValid()) return null
  return parsed.format('YYYY-MM-DD')
}

export default async function ChangelogPage() {
  const releases = await fetchReleases()

  return (
    <DocsPage>
      <DocsTitle>Changelog</DocsTitle>
      <DocsDescription>
        Summary of changes across releases of{' '}
        <a
          href="https://github.com/47ng/nuqs"
          target="_blank"
          rel="noopener noreferrer"
        >
          47ng/nuqs
        </a>
        . Grouped by category, with links and attribution to contributors.
      </DocsDescription>

      <DocsBody>
        {releases.length === 0 ? (
          <p>No releases could be loaded from GitHub at this time.</p>
        ) : (
          <div className="space-y-12">
            {releases.map(release => {
              const categories = parseReleaseBody(release.body)
              const date = formatDate(release.published_at)
              const hasAnyItems = CATEGORY_ORDER.some(
                id => categories[id].length > 0
              )

              if (!hasAnyItems) {
                return null
              }

              return (
                <section key={release.id}>
                  <h2>{release.name || release.tag_name}</h2>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                    {date && <span>Published on {date}</span>}
                    <a
                      href={release.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on GitHub
                    </a>
                  </div>

                  <div className="space-y-6">
                    {CATEGORY_ORDER.map(categoryId => {
                      const items = categories[categoryId]
                      if (!items.length) return null

                      return (
                        <section key={categoryId}>
                          <h3>{CATEGORY_LABELS[categoryId]}</h3>
                          <ul className="space-y-3">
                            {items.map((item, index) => (
                              <li key={`${categoryId}-${release.id}-${index}`}>
                                <PullRequestLine number={item.number} />
                              </li>
                            ))}
                          </ul>
                        </section>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </DocsBody>
    </DocsPage>
  )
}
