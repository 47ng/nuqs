import React from 'react'

export const metadata = {
  title: 'next-usequerystate playground'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
