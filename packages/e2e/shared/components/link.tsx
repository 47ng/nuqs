import { createContext, useContext } from 'react'

export type LinkProps = {
  href: string
  children: React.ReactNode
  replace?: boolean
}

type LinkContextValue = {
  Link: React.ComponentType<LinkProps>
}

const LinkContext = createContext<LinkContextValue>({
  Link: () => {
    throw new Error('Link component was not provided')
  }
})

export function useLink() {
  return useContext(LinkContext).Link
}

export function LinkProvider({
  children,
  Link
}: {
  children: React.ReactNode
  Link: React.ComponentType<LinkProps>
}) {
  return (
    <LinkContext.Provider value={{ Link }}>{children}</LinkContext.Provider>
  )
}
