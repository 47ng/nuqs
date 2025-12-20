import { type NextRequest, NextResponse } from 'next/server';
import { getLLMText } from '@/src/lib/get-llm-text';
import { source } from '@/src/app/source';
import { notFound } from 'next/navigation';

export const revalidate = false;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  // Convert the slug string to an array (split by '/') for getPage()
  // e.g., "parsers/built-in" -> ["parsers", "built-in"]
  const slugArray = slug.split('/').filter(Boolean);
  const page = source.getPage(slugArray);
  if (!page) notFound();

  return new NextResponse(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return source.getPages().map(page => {
    // Extract the path after /docs/ from the page URL
    // e.g., /docs/getting-started -> getting-started
    // e.g., /docs/parsers/built-in -> parsers/built-in
    const slug = page.url.replace(/^\/docs\//, '').replace(/\/$/, '');
    return { slug };
  })
}
