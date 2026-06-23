import { RootLayout } from '@/layout'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <NuqsAdapter>
        <RootLayout>
          <Outlet />
        </RootLayout>
      </NuqsAdapter>
      <TanStackRouterDevtools />
    </>
  )
})
