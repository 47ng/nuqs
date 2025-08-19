'use client'

import { useParams, usePathname } from 'next/navigation'

export function TenantClient() {
  const params = useParams()
  const pathname = usePathname()
  return (
    <>
      <p id="client-tenant">{params?.tenant}</p>
      <p id="router-pathname">{pathname}</p>
    </>
  )
}
