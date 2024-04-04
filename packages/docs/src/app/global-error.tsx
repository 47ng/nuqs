'use client'

import * as Sentry from '@sentry/nextjs'
import Error from 'next/error'
import { useEffect } from 'react'

export default function GlobalError({ error }: { error: unknown }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

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
