import { source } from '@/src/app/source';
import { getLLMText } from '@/src/lib/get-llm-text';
import { flattenTree } from 'fumadocs-core/page-tree';

export const revalidate = false;

export async function GET() {
  const orderedItems = flattenTree(source.pageTree.children);
  const allPages = source.getPages();

  const pages = orderedItems
    .map(item => allPages.find(page => page.url === item.url))
    .filter((page): page is NonNullable<typeof page> =>
      page !== undefined && page.data.exposeToLlms !== false
    );

  const scan = pages.map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}