export function Favicon() {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'development'
  const isDev = env === 'development'
  const filePath = isDev ? '/icon.dev.svg' : '/icon.svg'
  return (
    <head>
      <link rel="icon" href={filePath} sizes="any" type="image/svg+xml" />
    </head>
  )
}
