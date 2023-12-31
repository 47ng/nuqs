import Link from 'next/link'
import { QuerySpy } from './query-spy'

export function PlaygroundPageLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <main>
      <Link href="/">⬅️ Home</Link>
      <QuerySpy />
      {children}
    </main>
  )
}
