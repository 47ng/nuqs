import dayjs from 'dayjs'
import type { Metadata } from 'next'
import { PullRequestLine } from '../../components/ui/pr-line'

export const metadata: Metadata = {
  title: 'Changelog'
}

export const revalidate = 3600

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
  text: string
  prNumber?: number
}

type ReleaseCategories = Record<CategoryId, ReleaseNoteItem[]>

type GithubRelease = {
  id: number
  tag_name: string
  name?: string | null
  html_url: string
  published_at?: string | null
  body?: string | null
  draft?: boolean
  prerelease?: boolean
}

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
      // Let Next.js cache + revalidate this page
      cache: 'force-cache'
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

  const data = (await response.json()) as GithubRelease[]
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
      currentCategory = classifyHeading(headingMatch[1])
      continue
    }

    // Bullet lines
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const itemText = line.replace(/^[-*]\s+/, '').trim()

      // Extract PR number from patterns like "#123" or "(#123)"
      const prMatch = /#(\d{1,6})\b/.exec(itemText)
      const prNumber = prMatch ? Number(prMatch[1]) : undefined

      // Remove "(#123)" to avoid duplication with PullRequestLine
      const cleanedText = itemText.replace(/\(#\d{1,6}\)/, '').trim()

      categories[currentCategory].push({
        text: cleanedText,
        prNumber: Number.isFinite(prNumber) ? prNumber : undefined
      })
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
    <main className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Changelog</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Summary of changes across releases of{' '}
          <a
            href="https://github.com/47ng/nuqs"
            className="font-medium underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            47ng/nuqs
          </a>
          . Grouped by category, with links and attribution to contributors.
        </p>
      </header>

      {releases.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No releases could be loaded from GitHub at this time.
        </p>
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
              <section key={release.id} className="space-y-4">
                <header className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {release.name || release.tag_name}
                  </h2>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                    {date && <span>Published on {date}</span>}
                    <a
                      href={release.html_url}
                      className="underline-offset-4 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on GitHub
                    </a>
                  </div>
                </header>

                <div className="space-y-6">
                  {CATEGORY_ORDER.map(categoryId => {
                    const items = categories[categoryId]
                    if (!items.length) return null

                    return (
                      <section key={categoryId} className="space-y-2">
                        <h3 className="text-lg font-semibold">
                          {CATEGORY_LABELS[categoryId]}
                        </h3>
                        <ul className="space-y-3">
                          {items.map((item, index) => (
                            <li
                              key={`${categoryId}-${release.id}-${index}`}
                              className="space-y-1"
                            >
                              <p className="text-sm text-gray-800 dark:text-gray-100">
                                {item.text}
                              </p>
                              {item.prNumber != null && (
                                <ul>
                                  <PullRequestLine
                                    number={item.prNumber}
                                    className="mt-0.5"
                                  />
                                </ul>
                              )}
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
    </main>
  )
}