import { createContext, useContext } from 'react'

type RouterOptions = {
  shallow?: boolean
}

export type Router = {
  replace(url: string, options: RouterOptions): void
  push(url: string, options: RouterOptions): void
}

type RouterContextValue = () => Router

const RouterContext = createContext<RouterContextValue>(
  function useAbstractRouter() {
    throw new Error('Router was not provided')
  }
)

export function useRouter() {
  return useContext(RouterContext)()
}

export function RouterProvider({
  children,
  useRouter
}: {
  children: React.ReactNode
  useRouter: () => Router
}) {
  return (
    <RouterContext.Provider value={useRouter}>
      {children}
    </RouterContext.Provider>
  )
}
