import { AsideSponsors } from '@/src/app/(pages)/_landing/sponsors'
import {
  CopyAsMarkdownButton,
  CopyMarkdownUrlButton,
  ViewOptions
} from '@/src/components/ai/page-actions'
import { github } from '@/src/lib/utils'
import { Heading } from 'fumadocs-ui/components/heading'
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle
} from 'fumadocs-ui/page'
import type { Metadata } from 'next'
import { Fragment } from 'react'
import { H2 } from '../../../components/typography'
import { PullRequestLine } from '../../../components/ui/pr-line'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  fetchReleases,
  formatDate,
  parseReleaseBody
} from './_lib'

export const metadata: Metadata = {
  title: 'Changelog'
}

export const revalidate = false

const MARKDOWN_URL = '/docs/changelog.md'
const SOURCE_URL = `https://github.com/${github.owner}/${github.repo}/blob/${github.branch}/packages/docs/src/app/docs/changelog/page.tsx`

export default async function ChangelogPage() {
  const releases = await fetchReleases()
  const visibleReleases = releases
    .map(release => ({
      release,
      categories: parseReleaseBody(release.body)
    }))
    .filter(({ categories }) =>
      CATEGORY_ORDER.some(id => categories[id].length > 0)
    )
  const toc = visibleReleases.map(({ release }) => ({
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
        {visibleReleases.length === 0 ? (
          <p>No releases could be loaded from GitHub at this time.</p>
        ) : (
          <div className="space-y-10 pb-12 sm:space-y-16">
            {visibleReleases.map(({ release, categories }, index) => {
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
                        {date && <span>Published on {date}</span>}
                        {date && (
                          <span
                            aria-hidden
                            className="text-fd-muted-foreground/60"
                          >
                            •
                          </span>
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

                      <div className="mt-6 space-y-6">
                        {CATEGORY_ORDER.map(categoryId => {
                          const items = categories[categoryId]
                          if (!items.length) return null

                          return (
                            <section key={categoryId}>
                              <Heading as="h3" id={`${tag}-${categoryId}`}>
                                {CATEGORY_LABELS[categoryId]}
                              </Heading>
                              <ul className="not-prose mt-3 list-none space-y-2 pl-0">
                                {items.map((item, itemIndex) => (
                                  <PullRequestLine
                                    key={`${categoryId}-${release.id}-${itemIndex}`}
                                    number={item.number}
                                  />
                                ))}
                              </ul>
                            </section>
                          )
                        })}
                      </div>
                    </section>
                  </Fragment>
                )
              })}
          </div>
        )}
      </DocsBody>
    </DocsPage>
  )
}
