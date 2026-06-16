import dayjs from 'dayjs'
import {
  type Category,
  type Change,
  groupChangesByCategory,
  parseChangelogComment,
  stripChangelogComment
} from 'scripts/lib/changelog-dto'
import { z } from 'zod'

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

// A single releases-list call (the newest 100), filtered to GA. We deliberately
// do NOT paginate: older GA releases beyond this page are reached via a "See
// more on GitHub" link, not rendered — keeping the page bounded rather than
// dumping the entire history. The call carries the `releases` cache tag (busted
// by the finalize workflow) and makes zero per-PR/per-commit enrichment calls —
// the DTO embedded in each release body is all the page reads.
export async function fetchReleases(): Promise<GithubRelease[]> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json'
  }
  const token = process.env.GITHUB_TOKEN
  if (token) {
    headers.Authorization = `bearer ${token}`
  }
  const response = await fetch(
    'https://api.github.com/repos/47ng/nuqs/releases?per_page=100',
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

// The render model for one release. `grouped` is null when the release has no
// valid DTO (missing/malformed/unrecognized) — the page renders a degraded entry
// (title + date + link) for it rather than dropping it or failing the build.
// `contributors` is empty in that degraded case (no footer).
export type ReleaseModel = {
  release: GithubRelease
  grouped: Record<Category, Change[]> | null
  preamble: string | null
  contributors: string[]
}

export function buildReleaseModel(release: GithubRelease): ReleaseModel {
  const parsed = parseChangelogComment(release.body)
  if (parsed === null) {
    console.warn(
      'changelog: release %s has no valid changelog DTO — rendering a degraded entry.',
      release.tag_name
    )
    return { release, grouped: null, preamble: null, contributors: [] }
  }
  return {
    release,
    grouped: groupChangesByCategory(parsed.dto.changes),
    preamble: parsed.preamble,
    contributors: parsed.dto.contributors
  }
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

// The `.md`/llms changelog renders the human-readable GitHub notes verbatim
// (minus the machine DTO comment, stripped so it doesn't leak into the text),
// not the structured DTO model — that drives the interactive page instead.
export async function getChangelogMarkdown(): Promise<string> {
  const releases = await fetchReleases()
  const sections = releases
    .map(release => ({
      release,
      body: bumpHeadings(stripChangelogComment(release.body ?? '').trim())
    }))
    .filter(({ body }) => body.length > 0)
    .map(({ release, body }) => {
      const title = release.name || release.tag_name
      const date = formatDate(release.published_at)
      const meta = [
        date && `Published on ${date}`,
        `[View on GitHub](${release.html_url})`
      ]
        .filter(Boolean)
        .join(' • ')
      return `## ${title}\n\n${meta}\n\n${body}`
    })

  return `# Changelog\n\nWhat's new in nuqs.\n\n${sections.join('\n\n---\n\n')}`
}
