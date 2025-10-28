import * as Sentry from '@sentry/nextjs'

const enabled =
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) &&
  Boolean(process.env.SENTRY_AUTH_TOKEN) &&
  ['production', 'preview'].includes(process.env.VERCEL_ENV ?? '')

export async function register() {
  if (!enabled) {
    return
  }
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
