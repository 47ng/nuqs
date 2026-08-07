'use client'

import Error from 'next/error'

export default function GlobalError({ error }: { error: unknown }) {
  const statusCode =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? Number(error.statusCode)
      : 500

  return (
    <html>
      <body>
        <Error statusCode={statusCode} />
      </body>
    </html>
  )
}
