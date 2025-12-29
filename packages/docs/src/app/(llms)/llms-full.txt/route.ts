import { fullSource } from '@/src/app/source';
import { getLLMText } from '@/src/lib/get-llm-text';
import { flattenTree } from 'fumadocs-core/page-tree';

export const revalidate = false;

export async function GET() {
  const orderedItems = flattenTree(fullSource.pageTree.children);
  const allPages = fullSource.getPages();
  const llmPages = allPages.filter(page => page.data.exposeTo.includes('llm'));

  // Get pages in sidebar order first
  const orderedPages = orderedItems
    .map(item => llmPages.find(page => page.url === item.url))
    .filter((page): page is NonNullable<typeof page> => page !== undefined);

  // Add any llm-only pages that aren't in the sidebar (not in meta.json)
  const orderedUrls = new Set(orderedPages.map(p => p.url));
  const llmOnlyPages = llmPages.filter(page => !orderedUrls.has(page.url));

  const pages = [...orderedPages, ...llmOnlyPages];

  const scan = pages.map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}