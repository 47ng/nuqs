import { loadSearchParams } from 'e2e-shared/specs/loader'
import { NextResponse } from 'next/server'

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
