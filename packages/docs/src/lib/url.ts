export function getBaseUrl() {
  return process.env.VERCEL_ENV === 'production'
    ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL
    : process.env.VERCEL_URL
      ? 'https://' + process.env.VERCEL_URL
      : ''
}
