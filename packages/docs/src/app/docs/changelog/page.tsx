import { AsideSponsors } from '@/src/app/(pages)/_landing/sponsors'
import {
  CopyAsMarkdownButton,
  CopyMarkdownUrlButton,
  ViewOptions
} from '@/src/components/ai/page-actions'
import { CommitLine } from '@/src/components/changelog/commit-line'
import { ContributorsFooter } from '@/src/components/changelog/contributors-footer'
import { PullRequestLine } from '@/src/components/changelog/pr-line'
import { Preamble } from '@/src/components/changelog/preamble'
import { github } from '@/src/lib/utils'
import { Heading } from 'fumadocs-ui/components/heading'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle
} from 'fumadocs-ui/page'
import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'
import { Fragment } from 'react'
import { CATEGORIES } from 'scripts/lib/changelog-dto'
import { H2 } from '../../../components/typography'
import { buildReleaseModel, fetchReleases, formatDate } from './_lib'

export const metadata: Metadata = {
  title: 'Changelog'
}

export const revalidate = false

const MARKDOWN_URL = '/docs/changelog.md'
const SOURCE_URL = `https://github.com/${github.owner}/${github.repo}/blob/${github.branch}/packages/docs/src/app/docs/changelog/page.tsx`

// Slugify a category label into a stable anchor id (e.g. "Bug fixes" → "bug-fixes").
function categorySlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-')
}

export default async function ChangelogPage() {
  const releases = await fetchReleases()
  const models = releases.map(buildReleaseModel)
  const toc = models.map(({ release }) => ({
    url: `#${release.tag_name}`,
    title: release.name || release.tag_name,
    depth: 2
  }))

  return (
    <DocsPage
      toc={toc}
      tableOfContent={{
        footer: <AsideSponsors />
      }}
    >
      <DocsTitle>Changelog</DocsTitle>
      <DocsDescription>What's new in nuqs.</DocsDescription>
      <div className="mb-2 flex flex-row flex-wrap items-center gap-2 border-b pb-6">
        <CopyAsMarkdownButton markdownUrl={MARKDOWN_URL} />
        <CopyMarkdownUrlButton markdownUrl={MARKDOWN_URL} />
        <ViewOptions markdownUrl={MARKDOWN_URL} githubUrl={SOURCE_URL} />
      </div>

      <DocsBody>
        {models.length === 0 ? (
          <p>No releases could be loaded from GitHub at this time.</p>
        ) : (
          <div className="space-y-10 pb-12 sm:space-y-16">
            {models.map(
              ({ release, grouped, contributors, preamble }, index) => {
                const date = formatDate(release.published_at)
                const tag = release.tag_name
                const title = release.name || tag

                return (
                  <Fragment key={release.id}>
                    {index > 0 && <hr className="border-border" />}
                    <section>
                      <H2 id={tag} className="mb-2">
                        {title}
                      </H2>
                      <div className="not-prose text-fd-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        {date && (
                          <>
                            <span>Published on {date}</span>
                            <span
                              aria-hidden
                              className="text-fd-muted-foreground/60"
                            >
                              •
                            </span>
                          </>
                        )}
                        <a
                          href={release.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          View on GitHub
                        </a>
                      </div>

                      {preamble && (
                        <div className="mt-6">
                          <Preamble markdown={preamble} />
                        </div>
                      )}

                      {grouped && (
                        <div className="mt-6 space-y-6">
                          {CATEGORIES.map(category => {
                            const items = grouped[category]
                            if (items.length === 0) return null

                            return (
                              <section key={category}>
                                <Heading
                                  as="h3"
                                  id={`${tag}-${categorySlug(category)}`}
                                >
                                  {category}
                                </Heading>
                                <ul className="not-prose mt-3 list-none space-y-2 pl-0">
                                  {items.map(item =>
                                    item.source === 'squashedPR' ? (
                                      <PullRequestLine
                                        key={`pr-${item.prNumber}`}
                                        prNumber={item.prNumber}
                                        description={item.description}
                                        author={item.author}
                                        breaking={item.breaking}
                                      />
                                    ) : (
                                      <CommitLine
                                        key={`commit-${item.sha}`}
                                        sha={item.sha}
                                        description={item.description}
                                        author={item.author}
                                        breaking={item.breaking}
                                      />
                                    )
                                  )}
                                </ul>
                              </section>
                            )
                          })}
                        </div>
                      )}

                      {contributors.length > 0 && (
                        <>
                          <Heading as="h3" id={`${tag}-contributors`}>
                            Contributors
                          </Heading>
                          <ContributorsFooter contributors={contributors} />
                        </>
                      )}
                    </section>
                  </Fragment>
                )
              }
            )}
            <div className="pt-2">
              <a
                href={`https://github.com/${github.owner}/${github.repo}/releases`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fd-muted-foreground text-sm decoration-current decoration-1 underline-offset-4"
              >
                See more releases on GitHub{' '}
                <ExternalLink className="inline h-4 w-4" />
              </a>
            </div>
          </div>
        )}
      </DocsBody>
    </DocsPage>
  )
}
