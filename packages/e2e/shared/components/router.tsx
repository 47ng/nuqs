import { createContext, useContext } from 'react'

type RouterOptions = {
  shallow?: boolean
}

export type Router = {
  replace(url: string, options: RouterOptions): void
  push(url: string, options: RouterOptions): void
}

const RouterContext = createContext<Router | null>(null)

export function useRouter(): Router {
  const router = useContext(RouterContext)
  if (router === null) {
    throw new Error('Router was not provided')
  }
  return router
}

export function RouterProvider({
  children,
  router
}: {
  children: React.ReactNode
  router: Router
}) {
  return (
    <RouterContext.Provider value={router}>{children}</RouterContext.Provider>
  )
}
