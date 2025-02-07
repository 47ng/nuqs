import { loadSearchParams } from 'e2e-shared/specs/loader'
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const { test, int } = loadSearchParams(request.query)
  response
    .status(200)
    .setHeader('content-type', 'text/html')
    .send(
      `<!doctype html>
<html>
<body>
    <div id="hydration-marker" style="display:none;" aria-hidden>hydrated</div>
    <pre id="test">${test}</pre>
    <pre id="int">${int}</pre>
</body>
</html>`
    )
}
