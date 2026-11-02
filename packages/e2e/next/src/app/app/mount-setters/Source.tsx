'use client'

import { useRouter } from 'next/navigation'

export function Source() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.replace('/app/mount-setters/dest?existing=1')}
    >
      Replace to destination
    </button>
  )
}
