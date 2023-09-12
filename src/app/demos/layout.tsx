import Link from 'next/link'

export const metadata = {
  title: 'next-usequerystate demos'
}

export default function DemoLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <main>
      <Link href="/">⬅️ Home</Link>
      {children}
    </main>
  )
}
