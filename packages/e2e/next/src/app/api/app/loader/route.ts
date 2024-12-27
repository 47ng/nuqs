import { loadSearchParams } from 'e2e-shared/specs/loader'
import { NextResponse } from 'next/server'

// Needed for Next.js 14.2.0 to 14.2.3
// (due to https://github.com/vercel/next.js/pull/66446)
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { test, int } = loadSearchParams(request)
  return new NextResponse(
    `<!doctype html>
<html>
<body>
    <div id="hydration-marker" style="display:none;" aria-hidden>hydrated</div>
    <pre id="test">${test}</pre>
    <pre id="int">${int}</pre>
</body>
</html>`,
    {
      headers: {
        'content-type': 'text/html'
      }
    }
  )
}
