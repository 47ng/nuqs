import Link from 'next/link'

export function DemoPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <Link href="/">⬅️ Home</Link>
      {children}
    </main>
  )
}
