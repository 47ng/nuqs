import { source } from '@/src/app/source';
import { getLLMText } from '@/src/lib/get-llm-text';

// cached forever
export const revalidate = false;

const PAGE_EXCLUSIONS = [
  "/docs/about",
];

export async function GET() {
  const pages = source.getPages().filter(page => !PAGE_EXCLUSIONS.includes(page.url));
  const scan = pages.map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}