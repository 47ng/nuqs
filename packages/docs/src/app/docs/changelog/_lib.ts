import dayjs from 'dayjs'
import { z } from 'zod'

export const CATEGORY_ORDER = [
  'features',
  'bug-fixes',
  'documentation',
  'other-changes'
] as const

type CategoryId = (typeof CATEGORY_ORDER)[number]

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  features: 'Features',
  'bug-fixes': 'Bug fixes',
  documentation: 'Documentation',
  'other-changes': 'Other changes'
}

export type ReleaseNoteItem = {
  number: number
}

export type ReleaseCategories = Record<CategoryId, ReleaseNoteItem[]>

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

export type GithubRelease = z.infer<typeof GithubReleaseSchema>

export async function fetchReleases(): Promise<GithubRelease[]> {
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

export function parseReleaseBody(body?: string | null): ReleaseCategories {
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

    const headingMatch = /^#{2,3}\s+(.+)$/.exec(line)
    if (headingMatch) {
      if (/thanks/i.test(headingMatch[1])) continue
      currentCategory = classifyHeading(headingMatch[1])
      continue
    }

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

export function formatDate(date?: string | null): string | null {
  if (!date) return null
  const parsed = dayjs(date)
  if (!parsed.isValid()) return null
  return parsed.format('YYYY-MM-DD')
}

// GitHub release bodies use `## Features`, `## Bug fixes`, etc. as section
// headings, which clash with our per-release `## v1.2.3` title. Bump every
// ATX heading one level deeper so sections nest under the release title.
function bumpHeadings(body: string): string {
  return body.replace(/^(#{1,5})(\s)/gm, '#$1$2')
}

export async function getChangelogMarkdown(): Promise<string> {
  const releases = await fetchReleases()
  const visible = releases.filter(release => {
    const categories = parseReleaseBody(release.body)
    return CATEGORY_ORDER.some(id => categories[id].length > 0)
  })

  const sections = visible.map(release => {
    const title = release.name || release.tag_name
    const date = formatDate(release.published_at)
    const meta = [
      date && `Published on ${date}`,
      `[View on GitHub](${release.html_url})`
    ]
      .filter(Boolean)
      .join(' • ')
    const body = bumpHeadings((release.body ?? '').trim())
    return `## ${title}\n\n${meta}\n\n${body}`
  })

  return `# Changelog\n\nWhat's new in nuqs.\n\n${sections.join('\n\n---\n\n')}`
}
