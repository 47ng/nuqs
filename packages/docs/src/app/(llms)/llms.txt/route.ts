import { fullSource } from '@/src/app/source';
import { getBaseUrl } from '@/src/lib/url';
import { flattenTree } from 'fumadocs-core/page-tree';

export const revalidate = false;

export async function GET() {
  const baseUrl = getBaseUrl();
  const orderedItems = flattenTree(fullSource.pageTree.children);
  const allPages = fullSource.getPages();
  const llmPages = allPages.filter(page => page.data.exposeTo.includes('llm'));

  // Get pages in sidebar order first
  const orderedPages = orderedItems
    .map(item => llmPages.find(page => page.url === item.url))
    .filter((page): page is NonNullable<typeof page> => page !== undefined);

  // Add any llm-only pages that aren't in the sidebar
  const orderedUrls = new Set(orderedPages.map(p => p.url));
  const llmOnlyPages = llmPages.filter(page => !orderedUrls.has(page.url));

  const pages = [...orderedPages, ...llmOnlyPages];

  const lines = [
    '# nuqs Documentation Index',
    '',
    'This index lists all documentation pages available to LLMs.',
    '',
    '## Available Pages',
    '',
    ...pages.map(page =>
      `- [${page.data.title}](${baseUrl}${page.url}.mdx): ${page.data.description ?? ''}`
    ),
    '',
    '## Bulk Download',
    '',
    `For the complete documentation in a single file, fetch: ${baseUrl}/llms-full.txt`
  ];

  return new Response(lines.join('\n'));
}
