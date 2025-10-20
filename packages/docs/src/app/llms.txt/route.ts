import { source } from '@/src/app/source';
import { getLLMText } from '@/src/lib/get-llm-text';

// cached forever
export const revalidate = false;

export async function GET() {
  const scan = source.getPages().map(getLLMText);
  const scanned = await Promise.all(scan);

  return new Response(scanned.join('\n\n'));
}