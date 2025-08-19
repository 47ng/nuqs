'use client'

import { LinkProvider } from 'e2e-shared/components/link'
import { type Router, RouterProvider } from 'e2e-shared/components/router'
import Link from 'next/link'
import { useRouter as useNextRouter } from 'next/navigation'
import { type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LinkProvider Link={Link}>
      <RouterProvider useRouter={useRouter}>{children}</RouterProvider>
    </LinkProvider>
  )
}

function useRouter(): Router {
  const router = useNextRouter()
  return {
    replace(url, { shallow }) {
      if (shallow) {
        history.replaceState(null, '', url)
      } else {
        router.replace(url)
      }
    },
    push(url, { shallow }) {
      if (shallow) {
        history.pushState(null, '', url)
      } else {
        router.push(url)
      }
    }
  }
}
