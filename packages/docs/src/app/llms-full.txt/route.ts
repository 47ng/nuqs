import { source } from '@/src/app/source';
import { getLLMText } from '@/src/lib/get-llm-text';

export const revalidate = false;

export async function GET() {
  const pages = source.getPages().filter(page => page.data.exposeToLlms !== false);
  const scan = pages.map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}